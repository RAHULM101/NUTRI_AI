"""
Nutri Store — REST API Views
All store-related endpoints for products, cart management,
affiliate checkout, and order history.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django.shortcuts import get_object_or_404

from .models import StoreCategory, Product, Cart, CartItem, AffiliateOrder
from .serializer import (
    StoreCategorySerializer, ProductSerializer,
    CartSerializer, CartItemSerializer, AffiliateOrderSerializer,
)


# ─────────────────────────────────────────────
#  PRODUCT VIEWS
# ─────────────────────────────────────────────

class ProductListView(APIView):
    """
    GET /api/store/products/
    Optional query params:
      ?category=<slug>
      ?partner=<partner_name>
      ?search=<term>
      ?featured=true
    """
    permission_classes = []  # Public — no auth required to browse

    def get(self, request):
        queryset = Product.objects.filter(is_available=True).select_related('category')

        category = request.query_params.get('category')
        partner = request.query_params.get('partner')
        search = request.query_params.get('search')
        featured = request.query_params.get('featured')

        if category:
            queryset = queryset.filter(category__slug=category)
        if partner:
            queryset = queryset.filter(partner_name__iexact=partner)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search) |
                Q(macro_tag__icontains=search)
            )
        if featured == 'true':
            queryset = queryset.filter(is_featured=True)

        # Also return categories for the filter chips
        categories = StoreCategory.objects.all()
        return Response({
            'products': ProductSerializer(queryset, many=True).data,
            'categories': StoreCategorySerializer(categories, many=True).data,
            'total': queryset.count(),
        })


class ProductDetailView(APIView):
    """GET /api/store/products/<id>/"""
    permission_classes = []

    def get(self, request, pk):
        product = get_object_or_404(Product, pk=pk, is_available=True)
        return Response(ProductSerializer(product).data)


# ─────────────────────────────────────────────
#  CART VIEWS
# ─────────────────────────────────────────────

class CartView(APIView):
    """
    GET  /api/store/cart/  → Retrieve user's cart
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        return Response(CartSerializer(cart).data)


class CartAddView(APIView):
    """
    POST /api/store/cart/add/
    Body: { product_id: int, quantity: int }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 1))

        if not product_id:
            return Response({'error': 'product_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        product = get_object_or_404(Product, pk=product_id, is_available=True)
        cart, _ = Cart.objects.get_or_create(user=request.user)

        item, created = CartItem.objects.get_or_create(cart=cart, product=product)
        if not created:
            item.quantity += quantity
        else:
            item.quantity = quantity
        item.save()

        return Response(CartSerializer(cart).data, status=status.HTTP_200_OK)


class CartItemUpdateView(APIView):
    """
    PATCH /api/store/cart/update/<item_id>/  → Update quantity
    DELETE /api/store/cart/update/<item_id>/  → Remove item
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, item_id):
        cart = get_object_or_404(Cart, user=request.user)
        item = get_object_or_404(CartItem, pk=item_id, cart=cart)

        quantity = int(request.data.get('quantity', item.quantity))
        if quantity <= 0:
            item.delete()
        else:
            item.quantity = quantity
            item.save()

        return Response(CartSerializer(cart).data)

    def delete(self, request, item_id):
        cart = get_object_or_404(Cart, user=request.user)
        item = get_object_or_404(CartItem, pk=item_id, cart=cart)
        item.delete()
        return Response(CartSerializer(cart).data)


# ─────────────────────────────────────────────
#  CHECKOUT VIEW
# ─────────────────────────────────────────────

class CheckoutView(APIView):
    """
    POST /api/store/checkout/
    Groups cart items by partner, logs a single AffiliateOrder with the
    full product snapshot, clears the cart, and returns per-partner
    redirect URLs so the frontend can open each partner in a separate tab.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        cart = get_object_or_404(Cart, user=request.user)
        items = cart.items.select_related('product').all()

        if not items.exists():
            return Response({'error': 'Your cart is empty'}, status=status.HTTP_400_BAD_REQUEST)

        # ── Group items by partner ──────────────────────────────────────────
        from collections import OrderedDict
        partner_groups = OrderedDict()  # preserve insertion order

        products_snapshot = []
        total = 0

        for item in items:
            p = item.product
            subtotal = float(p.price) * item.quantity
            total += subtotal

            snapshot = {
                'id': p.id,
                'name': p.name,
                'price': float(p.price),
                'quantity': item.quantity,
                'subtotal': subtotal,
                'partner_name': p.partner_name,
                'image_url': p.image_url,
                'affiliate_link': p.affiliate_link,
            }
            products_snapshot.append(snapshot)

            if p.partner_name not in partner_groups:
                partner_groups[p.partner_name] = {
                    'partner_name': p.partner_name,
                    'affiliate_link': p.affiliate_link,
                    'subtotal': 0,
                    'item_count': 0,
                }
            partner_groups[p.partner_name]['subtotal'] += subtotal
            partner_groups[p.partner_name]['item_count'] += item.quantity

        partner_name = ', '.join(partner_groups.keys())
        # Use the first partner's link as the primary redirect (for backwards compat)
        primary_redirect = next(iter(partner_groups.values()))['affiliate_link']

        # ── Build per-partner redirect list ─────────────────────────────────
        partner_redirects = []
        for pg in partner_groups.values():
            partner_redirects.append({
                'partner_name': pg['partner_name'],
                'affiliate_link': pg['affiliate_link'],
                'subtotal': round(pg['subtotal'], 2),
                'item_count': pg['item_count'],
            })

        # ── Create order record ─────────────────────────────────────────────
        order = AffiliateOrder.objects.create(
            user=request.user,
            products=products_snapshot,
            total_price=round(total, 2),
            partner_name=partner_name,
            redirect_url=primary_redirect,
            status='redirected',
        )

        # Clear cart
        items.delete()

        return Response({
            'message': 'Order logged successfully',
            'order_id': order.id,
            'redirect_url': primary_redirect,
            'partner_redirects': partner_redirects,
            'total': round(total, 2),
            'partner': partner_name,
        }, status=status.HTTP_201_CREATED)


# ─────────────────────────────────────────────
#  ORDER HISTORY VIEW
# ─────────────────────────────────────────────

class OrderHistoryView(APIView):
    """GET /api/store/orders/ — Fetch user's affiliate order history"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = AffiliateOrder.objects.filter(user=request.user)
        return Response(AffiliateOrderSerializer(orders, many=True).data)
