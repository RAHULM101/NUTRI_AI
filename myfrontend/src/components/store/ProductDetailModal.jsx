import { useEffect } from 'react';
import { X, ShoppingCart, ExternalLink, Flame, Dumbbell, Wheat, Droplets } from 'lucide-react';

const PARTNER_STYLE = {
  'Blinkit':          { cls: 'partner-blinkit',   emoji: '🟢', color: '#92C739' },
  'Zepto':            { cls: 'partner-zepto',      emoji: '🟣', color: '#A855F7' },
  'Swiggy Instamart': { cls: 'partner-swiggy',     emoji: '🟠', color: '#FC8019' },
  'Zomato':           { cls: 'partner-zomato',     emoji: '🔴', color: '#E13737' },
  'HealthKart':       { cls: 'partner-healthkart', emoji: '🩵', color: '#14B8A6' },
};

function NutritionPill({ icon: Icon, label, value, color, dark }) {
  const pillBg  = dark ? 'rgba(255,255,255,0.04)' : '#F8FAFC';
  const pillBdr = dark ? 'rgba(255,255,255,0.08)' : '#E2E8F0';
  const valCol  = dark ? '#fff'                   : '#0F172A';
  const labCol  = dark ? 'rgba(255,255,255,0.4)'  : '#94A3B8';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 16px', background: pillBg, border: `1px solid ${pillBdr}`, borderRadius: 12, flex: 1, minWidth: 72 }}>
      <Icon size={16} style={{ color, marginBottom: 6 }} />
      <p style={{ fontSize: 18, fontWeight: 800, color: valCol }}>{value ?? '—'}</p>
      <p style={{ fontSize: 10, color: labCol, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
    </div>
  );
}

export default function ProductDetailModal({ product, dark = true, onClose, onAddToCart, onBuyNow }) {
  const ps = PARTNER_STYLE[product.partner_name] || { cls: 'partner-healthkart', emoji: '🏪', color: '#14B8A6' };

  const modalBg  = dark ? '#1E293B'                   : '#FFFFFF';
  const modalBdr = dark ? 'rgba(255,255,255,0.1)'     : '#E2E8F0';
  const imgBg    = dark ? '#0F172A'                   : '#F1F5F9';
  const namCol   = dark ? '#fff'                      : '#0F172A';
  const descCol  = dark ? 'rgba(255,255,255,0.55)'    : '#475569';
  const labCol   = dark ? 'rgba(255,255,255,0.4)'     : '#94A3B8';
  const ingBg    = dark ? 'rgba(255,255,255,0.03)'    : '#F8FAFC';
  const ingBdr   = dark ? 'rgba(255,255,255,0.07)'    : '#E2E8F0';
  const divCol   = dark ? 'rgba(255,255,255,0.08)'    : '#E2E8F0';
  const priceLab = dark ? 'rgba(255,255,255,0.35)'    : '#94A3B8';
  const closeBg  = dark ? 'rgba(255,255,255,0.06)'    : '#F1F5F9';
  const closeBdr = dark ? 'rgba(255,255,255,0.1)'     : '#E2E8F0';
  const closeCol = dark ? 'rgba(255,255,255,0.6)'     : '#64748B';

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

  useEffect(() => {
    const handleKey = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="store-fade-scale"
        style={{ background: modalBg, border: `1px solid ${modalBdr}`, borderRadius: 20, width: '100%', maxWidth: 760, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'row' }}
      >
        {/* LEFT — Image */}
        <div style={{ width: 280, flexShrink: 0, background: imgBg, position: 'relative', overflow: 'hidden' }}>
          <img src={imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 16px 14px', background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)' }}>
            <span className={ps.cls} style={{ padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, border: '1px solid' }}>
              {ps.emoji} {product.partner_name}
            </span>
            {product.delivery_eta && (
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 6 }}>⚡ Delivered in {product.delivery_eta}</p>
            )}
          </div>
        </div>

        {/* RIGHT — Details */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {product.category_name && (
                <p style={{ fontSize: 11, color: '#14B8A6', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                  {product.category_name}
                </p>
              )}
              <h2 style={{ fontSize: 20, fontWeight: 800, color: namCol, lineHeight: 1.3 }}>{product.name}</h2>
              {product.macro_tag && (
                <span style={{ display: 'inline-block', marginTop: 8, background: 'rgba(20,184,166,0.15)', border: '1px solid rgba(20,184,166,0.4)', color: '#14B8A6', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6 }}>
                  {product.macro_tag}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, border: `1px solid ${closeBdr}`, background: closeBg, color: closeCol, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginLeft: 12 }}
            >
              <X size={15} />
            </button>
          </div>

          {/* Description */}
          {product.description && (
            <p style={{ fontSize: 13, color: descCol, lineHeight: 1.7 }}>{product.description}</p>
          )}

          {/* Nutrition Grid */}
          {(product.calories != null || product.protein != null) && (
            <div>
              <p style={{ fontSize: 11, color: labCol, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
                Per Serving {product.serving_size ? `(${product.serving_size})` : ''}
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <NutritionPill icon={Flame}    label="Calories" value={product.calories}                              color="#F59E0B" dark={dark} />
                <NutritionPill icon={Dumbbell} label="Protein"  value={product.protein ? `${product.protein}g` : null} color="#14B8A6" dark={dark} />
                <NutritionPill icon={Wheat}    label="Carbs"    value={product.carbs   ? `${product.carbs}g`   : null} color="#F97316" dark={dark} />
                <NutritionPill icon={Droplets} label="Fat"      value={product.fat     ? `${product.fat}g`     : null} color="#818CF8" dark={dark} />
              </div>
            </div>
          )}

          {/* Ingredients */}
          {product.ingredients && (
            <div style={{ padding: '12px 14px', borderRadius: 10, background: ingBg, border: `1px solid ${ingBdr}` }}>
              <p style={{ fontSize: 11, color: labCol, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Ingredients</p>
              <p style={{ fontSize: 12, color: descCol, lineHeight: 1.6 }}>{product.ingredients}</p>
            </div>
          )}

          {/* Price + Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${divCol}`, paddingTop: 16, marginTop: 'auto' }}>
            <div>
              <p style={{ fontSize: 10, color: priceLab, marginBottom: 2 }}>Price</p>
              <p style={{ fontSize: 26, fontWeight: 800, color: namCol }}>₹{Number(product.price).toLocaleString('en-IN')}</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => onAddToCart(product.id)}
                style={{ height: 42, padding: '0 18px', borderRadius: 10, border: '1px solid rgba(20,184,166,0.4)', background: 'rgba(20,184,166,0.1)', color: '#14B8A6', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', transition: 'all 150ms' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(20,184,166,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(20,184,166,0.1)'; }}
              >
                <ShoppingCart size={15} /> Add to Cart
              </button>
              <button
                onClick={() => onBuyNow(product)}
                style={{ height: 42, padding: '0 18px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${ps.color}cc, ${ps.color})`, color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', transition: 'opacity 150ms' }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
              >
                <ExternalLink size={14} /> Buy on {product.partner_name}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
