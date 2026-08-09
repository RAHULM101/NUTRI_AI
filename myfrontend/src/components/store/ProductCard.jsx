import { useState } from 'react';
import { ShoppingCart, Eye } from 'lucide-react';

const PARTNER_STYLE = {
  'Blinkit':          { cls: 'partner-blinkit',   emoji: '🟢' },
  'Zepto':            { cls: 'partner-zepto',      emoji: '🟣' },
  'Swiggy Instamart': { cls: 'partner-swiggy',     emoji: '🟠' },
  'Zomato':           { cls: 'partner-zomato',     emoji: '🔴' },
  'HealthKart':       { cls: 'partner-healthkart', emoji: '🩵' },
};

export default function ProductCard({ product, dark = true, onAddToCart, onQuickView }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [hovered,   setHovered]   = useState(false);
  const [adding,    setAdding]    = useState(false);

  const ps = PARTNER_STYLE[product.partner_name] || { cls: 'partner-healthkart', emoji: '🏪' };

  const cardBg     = dark ? '#1E293B'                    : '#FFFFFF';
  const cardBorder = dark
    ? (hovered ? 'rgba(20,184,166,0.4)' : 'rgba(255,255,255,0.08)')
    : (hovered ? 'rgba(20,184,166,0.5)' : '#E2E8F0');
  const imgBg      = dark ? '#0F172A' : '#F1F5F9';
  const namCol     = dark ? '#fff'    : '#0F172A';
  const subCol     = dark ? 'rgba(255,255,255,0.4)' : '#94A3B8';
  const qvBtnBg    = dark ? 'rgba(255,255,255,0.06)' : '#F1F5F9';
  const qvBtnBdr   = dark ? 'rgba(255,255,255,0.12)' : '#CBD5E1';
  const qvBtnCol   = dark ? 'rgba(255,255,255,0.6)'  : '#64748B';

  // Pick the local high-fidelity image based on product name/category
  const imageUrl = (() => {
    // If it's already a correct local path, use it
    if (product.image_url && product.image_url.startsWith('/products/')) {
      return product.image_url;
    }
    
    // Prioritize name-matching to map both old and new product names to local files
    const name = (product.name || '').toLowerCase();
    
    if (name.includes('peanut butter')) return '/products/alpino_peanut_butter.jpg';
    if (name.includes('creatine')) return '/products/mb_creatine.jpg';
    if (name.includes('whey') && name.includes('muscleblaze')) return '/products/mb_whey.jpg';
    if (name.includes('whey') && name.includes('gold standard')) return '/products/on_whey.jpg';
    if (name.includes('oats') || name.includes('oat')) return '/products/true_elements_oats.jpg';
    if (name.includes('yogurt')) return '/products/epigamia_yogurt.jpg';
    if (name.includes('makhana')) return '/products/farmley_makhana.jpg';
    if (name.includes('granola')) return '/products/true_elements_granola.jpg';
    if (name.includes('tea')) return '/products/tetley_green_tea.jpg';
    if (name.includes('bar') || name.includes('yoga bar') || name.includes('yogabar')) return '/products/yogabar_protein_bar.jpg';
    
    // Fallback if not matching our 10 products
    if (product.image_url && !product.image_url.includes('placeholder') && !product.image_url.includes('grofers')) {
      return product.image_url;
    }
    return '/products/on_whey.jpg';
  })();

  async function handleAdd(e) {
    e.stopPropagation();
    setAdding(true);
    await onAddToCart(product.id);
    setTimeout(() => setAdding(false), 600);
  }

  return (
    <div
      onClick={() => onQuickView(product)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
        transition: 'transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered
          ? (dark ? '0 16px 40px rgba(0,0,0,0.5)' : '0 12px 32px rgba(0,0,0,0.12)')
          : (dark ? '0 2px 8px rgba(0,0,0,0.25)'  : '0 1px 4px rgba(0,0,0,0.06)'),
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', height: 180, overflow: 'hidden', background: imgBg, flexShrink: 0 }}>
        {!imgLoaded && (
          <div className={dark ? 'store-shimmer' : 'store-shimmer-light'} style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }} />
        )}
        <img
          src={imageUrl}
          alt={product.name}
          onLoad={() => setImgLoaded(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: imgLoaded ? 1 : 0, transition: 'opacity 300ms, transform 300ms', transform: hovered ? 'scale(1.06)' : 'scale(1)' }}
        />

        {/* Partner badge */}
        <span className={`${ps.cls} store-badge-pop`} style={{ position: 'absolute', top: 10, left: 10, padding: '3px 9px', borderRadius: 8, fontSize: 10, fontWeight: 700, border: '1px solid', backdropFilter: 'blur(8px)' }}>
          {ps.emoji} {product.partner_name}
        </span>

        {/* Featured */}
        {product.is_featured && (
          <span style={{ position: 'absolute', top: 10, right: 10, padding: '3px 8px', borderRadius: 8, background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.4)', fontSize: 9, fontWeight: 700, color: '#F59E0B' }}>
            ⭐ FEATURED
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', gap: 7, flex: 1 }}>
        {/* Category + macro tag */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          {product.category_name && (
            <span style={{ fontSize: 10, fontWeight: 600, color: subCol, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {product.category_name}
            </span>
          )}
          {product.macro_tag && (
            <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(20,184,166,0.12)', border: '1px solid rgba(20,184,166,0.3)', color: '#14B8A6', padding: '2px 8px', borderRadius: 6 }}>
              {product.macro_tag}
            </span>
          )}
        </div>

        {/* Name */}
        <p style={{ fontSize: 14, fontWeight: 700, color: namCol, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {product.name}
        </p>

        {/* Delivery ETA */}
        {product.delivery_eta && (
          <p style={{ fontSize: 11, color: subCol }}>
            ⚡ {product.delivery_eta} via {product.partner_name}
          </p>
        )}

        {/* Price + Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 6 }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: namCol }}>
            ₹{Number(product.price).toLocaleString('en-IN')}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={e => { e.stopPropagation(); onQuickView(product); }}
              style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${qvBtnBdr}`, background: qvBtnBg, color: qvBtnCol, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 150ms' }}
              title="Quick View"
              onMouseEnter={e => { e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.15)' : '#E2E8F0'; e.currentTarget.style.color = namCol; }}
              onMouseLeave={e => { e.currentTarget.style.background = qvBtnBg; e.currentTarget.style.color = qvBtnCol; }}
            >
              <Eye size={15} />
            </button>

            <button
              onClick={handleAdd}
              disabled={adding}
              style={{ height: 34, padding: '0 14px', borderRadius: 8, border: 'none', background: adding ? 'rgba(20,184,166,0.5)' : 'linear-gradient(135deg, #0D9488, #14B8A6)', color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5, cursor: adding ? 'not-allowed' : 'pointer', transition: 'opacity 200ms, transform 150ms' }}
              onMouseEnter={e => { if (!adding) e.currentTarget.style.opacity = '0.85'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
            >
              <ShoppingCart size={13} />
              {adding ? '✓' : 'Add'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
