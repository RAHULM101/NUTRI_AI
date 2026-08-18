import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { ShoppingBag, ClipboardList, ShoppingCart, Sun, Moon } from 'lucide-react';
import StoreHero from './StoreHero';
import StoreFilters from './StoreFilters';
import ProductCard from './ProductCard';
import ProductDetailModal from './ProductDetailModal';
import CartDrawer from './CartDrawer';
import OrderHistory from './OrderHistory';

const API = import.meta.env.VITE_BACKEND_URL;

function getAuthHeader() {
  const token = localStorage.getItem('access_token')?.replace(/['"]+/g, '');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const TABS = [
  { id: 'products', label: 'Products',     icon: ShoppingBag },
  { id: 'orders',   label: 'Order History', icon: ClipboardList },
];

export default function NutriStore({ dark, onCartChange }) {
  // ── Colour tokens (derived from dark flag) ───────────────────────────────
  const T = {
    pageBg:       dark ? '#0F172A'                       : '#F8FAFC',
    cardBg:       dark ? '#1E293B'                       : '#FFFFFF',
    cardBorder:   dark ? 'rgba(255,255,255,0.08)'        : '#E2E8F0',
    headerBg:     dark ? '#1E293B'                       : '#FFFFFF',
    headerBorder: dark ? 'rgba(255,255,255,0.08)'        : '#E2E8F0',
    text:         dark ? '#F1F5F9'                       : '#0F172A',
    subtext:      dark ? 'rgba(255,255,255,0.4)'         : '#64748B',
    tabBg:        dark ? '#1E293B'                       : '#F1F5F9',
    tabActiveBg:  dark ? 'rgba(20,184,166,0.18)'         : 'rgba(20,184,166,0.12)',
    tabActiveCol: '#14B8A6',
    tabInactCol:  dark ? 'rgba(255,255,255,0.5)'         : '#64748B',
    cartBtnBg:    dark ? 'rgba(20,184,166,0.1)'          : 'rgba(20,184,166,0.08)',
    cartBtnBdr:   dark ? 'rgba(20,184,166,0.35)'         : 'rgba(20,184,166,0.4)',
    toggleBg:     dark ? 'rgba(255,255,255,0.06)'        : '#E2E8F0',
    toggleBdr:    dark ? 'rgba(255,255,255,0.1)'         : '#CBD5E1',
    toggleCol:    dark ? '#94A3B8'                       : '#475569',
    emptyCol:     dark ? 'rgba(255,255,255,0.3)'         : '#94A3B8',
    emptyTextCol: dark ? 'rgba(255,255,255,0.5)'         : '#64748B',
  };

  const [tab, setTab] = useState('products');

  // Products & filters
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [partner, setPartner] = useState('');

  // Modal
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Cart
  const [cart, setCart] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  // Orders
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // ── Fetch Products ────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const params = {};
      if (search)   params.search   = search;
      if (category) params.category = category;
      if (partner)  params.partner  = partner;
      const res = await axios.get(`${API}/api/store/products/`, { params });
      setProducts(res.data.products || []);
    } catch (err) {
      console.error('Failed to fetch products', err);
    } finally {
      setProductsLoading(false);
    }
  }, [search, category, partner]);

  useEffect(() => {
    const delay = setTimeout(fetchProducts, 280);
    return () => clearTimeout(delay);
  }, [fetchProducts]);

  // ── Fetch Cart ────────────────────────────────────────────────────────────
  const fetchCart = useCallback(async () => {
    const headers = getAuthHeader();
    if (!headers.Authorization) return;
    try {
      const res = await axios.get(`${API}/api/store/cart/`, { headers });
      setCart(res.data);
      onCartChange?.(res.data.item_count ?? 0);
    } catch (err) {
      console.error('Failed to fetch cart', err);
    }
  }, []);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  // ── Add to Cart ───────────────────────────────────────────────────────────
  async function handleAddToCart(productId) {
    const headers = getAuthHeader();
    if (!headers.Authorization) {
      alert('Please log in to add items to your cart.');
      return;
    }
    try {
      const res = await axios.post(
        `${API}/api/store/cart/add/`,
        { product_id: productId, quantity: 1 },
        { headers }
      );
      setCart(res.data);
      onCartChange?.(res.data.item_count ?? 0);
    } catch (err) {
      console.error('Add to cart failed', err);
    }
  }

  // ── Update Cart Item ──────────────────────────────────────────────────────
  async function handleUpdateItem(itemId, quantity) {
    const headers = getAuthHeader();
    try {
      if (quantity <= 0) {
        const res = await axios.delete(`${API}/api/store/cart/update/${itemId}/`, { headers });
        setCart(res.data);
        onCartChange?.(res.data.item_count ?? 0);
      } else {
        const res = await axios.patch(`${API}/api/store/cart/update/${itemId}/`, { quantity }, { headers });
        setCart(res.data);
        onCartChange?.(res.data.item_count ?? 0);
      }
    } catch (err) {
      console.error('Update cart failed', err);
    }
  }

  // ── Remove Cart Item ──────────────────────────────────────────────────────
  async function handleRemoveItem(itemId) {
    const headers = getAuthHeader();
    try {
      const res = await axios.delete(`${API}/api/store/cart/update/${itemId}/`, { headers });
      setCart(res.data);
      onCartChange?.(res.data.item_count ?? 0);
    } catch (err) {
      console.error('Remove item failed', err);
    }
  }

  // ── Checkout ──────────────────────────────────────────────────────────────
  async function handleCheckout() {
    const headers = getAuthHeader();
    setCheckingOut(true);
    try {
      const res = await axios.post(`${API}/api/store/checkout/`, {}, { headers });
      const { partner_redirects } = res.data;
      setCart(null);
      setCartOpen(false);
      onCartChange?.(0);
      if (partner_redirects?.length) {
        for (const pr of partner_redirects) {
          window.open(pr.affiliate_link, '_blank', 'noopener,noreferrer');
        }
      }
      // Refresh orders if on that tab
      if (tab === 'orders') fetchOrders();
      fetchCart();
    } catch (err) {
      console.error('Checkout failed', err);
    } finally {
      setCheckingOut(false);
    }
  }

  // ── Buy Now (single product, from modal) ─────────────────────────────────
  async function handleBuyNow(product) {
    await handleAddToCart(product.id);
    window.open(product.affiliate_link, '_blank', 'noopener,noreferrer');
    setSelectedProduct(null);
  }

  // ── Fetch Orders ──────────────────────────────────────────────────────────
  function fetchOrders() {
    const headers = getAuthHeader();
    if (!headers.Authorization) return;
    setOrdersLoading(true);
    axios.get(`${API}/api/store/orders/`, { headers })
      .then(res => setOrders(res.data))
      .catch(err => console.error('Fetch orders failed', err))
      .finally(() => setOrdersLoading(false));
  }

  useEffect(() => {
    if (tab !== 'orders') return;
    fetchOrders();
  }, [tab]);

  const cartCount = cart?.item_count ?? 0;

  return (
    <div style={{
      minHeight: '100vh',
      background: T.pageBg,
      padding: '28px 32px',
      transition: 'background 250ms ease, color 250ms ease',
    }}>
      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 24,
        padding: '14px 20px',
        background: T.headerBg,
        borderRadius: 14,
        border: `1px solid ${T.headerBorder}`,
        boxShadow: dark ? 'none' : '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: T.text }}>Nutri Store</h1>
          <p style={{ fontSize: 13, color: T.subtext, marginTop: 2 }}>
            Healthy products delivered fast via quick-commerce partners
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Cart button */}
          <button
            id="store-cart-btn"
            onClick={() => setCartOpen(true)}
            style={{
              position: 'relative',
              height: 38, padding: '0 18px',
              borderRadius: 10, border: `1px solid ${T.cartBtnBdr}`,
              background: T.cartBtnBg,
              color: '#14B8A6', fontSize: 13, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 8,
              cursor: 'pointer', transition: 'all 150ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(20,184,166,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = T.cartBtnBg; }}
          >
            <ShoppingCart size={16} />
            Cart
            {cartCount > 0 && (
              <span className="store-badge-pop" style={{
                background: '#14B8A6', color: '#fff',
                fontSize: 10, fontWeight: 800,
                minWidth: 18, height: 18, borderRadius: 9,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 4px',
              }}>
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 24,
        background: T.tabBg,
        borderRadius: 12, padding: 4, width: 'fit-content',
        border: `1px solid ${T.cardBorder}`,
      }}>
        {TABS.map(t => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              id={`store-tab-${t.id}`}
              onClick={() => setTab(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '8px 18px', borderRadius: 9,
                border: 'none',
                background: active ? T.tabActiveBg : 'transparent',
                color: active ? T.tabActiveCol : T.tabInactCol,
                fontSize: 13, fontWeight: 700,
                cursor: 'pointer', transition: 'all 150ms',
              }}
            >
              <t.icon size={15} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* ── PRODUCTS TAB ─────────────────────────────────────────────────── */}
      {tab === 'products' && (
        <>
          <StoreHero dark={dark} />

          <StoreFilters
            dark={dark}
            search={search}     onSearch={setSearch}
            category={category} onCategory={setCategory}
            partner={partner}   onPartner={setPartner}
          />

          {/* Grid */}
          {productsLoading ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 20,
            }}>
              {[1,2,3,4,5,6].map(i => (
                <div
                  key={i}
                  className={dark ? 'store-shimmer' : 'store-shimmer-light'}
                  style={{ height: 320, borderRadius: 16 }}
                />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '80px 20px',
              color: T.emptyCol,
            }}>
              <ShoppingBag size={52} strokeWidth={1} style={{ margin: '0 auto 16px' }} />
              <p style={{ fontSize: 16, fontWeight: 600, color: T.emptyTextCol }}>
                No products found
              </p>
              <p style={{ fontSize: 13 }}>Try adjusting your filters or search query.</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 20,
            }}>
              {products.map(p => (
                <ProductCard
                  key={p.id}
                  product={p}
                  dark={dark}
                  onAddToCart={handleAddToCart}
                  onQuickView={setSelectedProduct}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── ORDERS TAB ───────────────────────────────────────────────────── */}
      {tab === 'orders' && (
        <OrderHistory orders={orders} loading={ordersLoading} dark={dark} />
      )}

      {/* ── Product Detail Modal ─────────────────────────────────────────── */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          dark={dark}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={async (id) => { await handleAddToCart(id); setSelectedProduct(null); }}
          onBuyNow={handleBuyNow}
        />
      )}

      {/* ── Cart Drawer ──────────────────────────────────────────────────── */}
      <CartDrawer
        cart={cart}
        open={cartOpen}
        dark={dark}
        onClose={() => setCartOpen(false)}
        onUpdate={handleUpdateItem}
        onRemove={handleRemoveItem}
        onCheckout={handleCheckout}
        checkingOut={checkingOut}
      />
    </div>
  );
}
