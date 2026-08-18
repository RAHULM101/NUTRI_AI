from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db import models
from django.db.models import Q
from .models import (
    UserProfile, meal_logs, chat_logs,
    StoreCategory, Product, Cart, CartItem, AffiliateOrder
)

User = get_user_model()


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)
    confirm_password = serializers.CharField(write_only=True, required=True)

    def validate(self, data):
        data['email'] = data['email'].strip().lower()
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({"password": "Passwords don't match"})
            
        if User.objects.filter(models.Q(email__iexact=data['email']) | models.Q(username__iexact=data['email'])).exists():
            raise serializers.ValidationError({"email": "User with this email already exists"})
            
        return data
    
    def create(self, validated_data):
        email = validated_data['email'].strip().lower()
        user = User.objects.create_user(
            username=email,
            email=email,
            password=validated_data['password'],
        )
        return user

class OnboardingSerializer(serializers.ModelSerializer):
    selected_plan = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = '__all__'

    def get_selected_plan(self, obj):
        try:
            if obj.active_subscription and obj.active_subscription.plan_type:
                return obj.active_subscription.plan_type
            if hasattr(obj, 'user') and obj.user:
                latest_sub = obj.user.subscriptions.order_by('-created_at').first()
                if latest_sub and latest_sub.plan_type:
                    return latest_sub.plan_type
        except Exception:
            pass
        return 'Free'

class MealImageUploadSerializer(serializers.Serializer):
    """
    A simple serializer used just to validate the image upload
    before sending it to Gemini.
    """
    image = serializers.ImageField(required=True)
class MealLogSerializer(serializers.ModelSerializer):
    """
    Serializer for saving and listing the actual meal logs in the database.
    """
    class Meta:
        model = meal_logs
        # You can specify exact fields, or use '__all__'
        fields = '__all__'
        read_only_fields = ['meal_id', 'created_at', 'tracking_id', 'user']


class ChatLogSerializer(serializers.ModelSerializer):
    """
    Serializer for saving and listing the actual chat logs in the database.
    """
    class Meta:
        model = chat_logs
        # You can specify exact fields, or use '__all__'
        fields = '__all__'
        read_only_fields = ['session_id', 'created_at', 'user','ai_response']


# ─────────────────────────────────────────────
#  NUTRI STORE SERIALIZERS
# ─────────────────────────────────────────────

class StoreCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreCategory
        fields = ['id', 'name', 'slug', 'icon']


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'category', 'category_name',
            'price', 'image_url', 'partner_name', 'affiliate_link',
            'calories', 'protein', 'carbs', 'fat', 'serving_size',
            'macro_tag', 'ingredients', 'delivery_eta',
            'is_available', 'is_featured', 'created_at',
        ]


class CartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source='product', write_only=True
    )
    subtotal = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'product_id', 'quantity', 'subtotal']

    def get_subtotal(self, obj):
        return float(obj.product.price) * obj.quantity


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.SerializerMethodField()
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ['id', 'items', 'total', 'item_count', 'created_at', 'updated_at']

    def get_total(self, obj):
        return sum(float(item.product.price) * item.quantity for item in obj.items.all())

    def get_item_count(self, obj):
        return sum(item.quantity for item in obj.items.all())


class AffiliateOrderSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = AffiliateOrder
        fields = [
            'id', 'products', 'total_price', 'partner_name',
            'redirect_url', 'status', 'status_display', 'created_at',
        ]