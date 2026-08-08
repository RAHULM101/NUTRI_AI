import { useMemo } from 'react';
import { X, ShoppingBag, Trash2, CreditCard, Minus, Plus } from 'lucide-react';

const PARTNER_STYLE = {
  'Blinkit':          { cls: 'partner-blinkit',   emoji: '🟢', color: '#92C739' },
  'Zepto':            { cls: 'partner-zepto',      emoji: '🟣', color: '#A855F7' },
  'Swiggy Instamart': { cls: 'partner-swiggy',     emoji: '🟠', color: '#FC8019' },
  'Zomato':           { cls: 'partner-zomato',     emoji: '🔴', color: '#E13737' },
  'HealthKart':       { cls: 'partner-healthkart', emoji: '🩵', color: '#14B8A6' },
};

function CartItemRow({ item, onUpdate, onRemove, dark }) {
  const imgBg  = dark ? '#0F172A'                  : '#F1F5F9';
  const namCol = dark ? '#fff'                     : '#0F172A';
  const subCol = dark ? 'rgba(255,255,255,0.4)'    : '#94A3B8';
  const divCol = dark ? 'rgba(255,255,255,0.05)'   : '#F1F5F9';

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 0', borderBottom: `1px solid ${divCol}` }}>
      <div style={{ width: 52, height: 52, borderRadius: 10, overflow: 'hidden', background: imgBg, flexShrink: 0 }}>
        <img src={item.product.image_url} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: namCol, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {item.product.name}
        </p>
        <p style={{ fontSize: 10, color: subCol, marginTop: 2 }}>₹{Number(item.product.price).toLocaleString('en-IN')} each</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
          <button className="store-qty-btn" onClick={() => onUpdate(item.id, item.quantity - 1)}><Minus size={10} /></button>
          <span style={{ fontSize: 13, fontWeight: 700, color: namCol, minWidth: 18, textAlign: 'center' }}>{item.quantity}</span>
          <button className="store-qty-btn" onClick={() => onUpdate(item.id, item.quantity + 1)}><Plus size={10} /></button>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 800, color: namCol }}>₹{Number(item.subtotal).toLocaleString('en-IN')}</p>
        <button
          onClick={() => onRemove(item.id)}
          style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 6, color: '#F87171', cursor: 'pointer', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 150ms' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.1)'; }}
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
}

function usePartnerGroups(items) {
  return useMemo(() => {
    if (!items?.length) return [];
    const map = {}, order = [];
    for (const item of items) {
      const pn = item.product.partner_name;
      if (!map[pn]) { map[pn] = { partner: pn, items: [], subtotal: 0 }; order.push(pn); }
      map[pn].items.push(item);
      map[pn].subtotal += Number(item.subtotal || 0);
    }
    return order.map(pn => map[pn]);
  }, [items]);
}

export default function CartDrawer({ cart, open, dark = true, onClose, onUpdate, onRemove, onCheckout, checkingOut }) {
  const DELIVERY_FEE = 29;
  const total = cart?.total ?? 0;
  const itemCount = cart?.item_count ?? 0;
  const partnerGroups = usePartnerGroups(cart?.items);
  const totalDeliveryFee = partnerGroups.length * DELIVERY_FEE;

  const drawerBg  = dark ? '#1E293B'                : '#FFFFFF';
  const drawerBdr = dark ? 'rgba(255,255,255,0.08)' : '#E2E8F0';
  const footerBg  = dark ? '#162032'                : '#F8FAFC';
  const headCol   = dark ? '#fff'                   : '#0F172A';
  const subCol    = dark ? 'rgba(255,255,255,0.4)'  : '#94A3B8';
  const closeBg   = dark ? 'rgba(255,255,255,0.05)' : '#F1F5F9';
  const closeBdr  = dark ? 'rgba(255,255,255,0.1)'  : '#E2E8F0';
  const closeCol  = dark ? 'rgba(255,255,255,0.6)'  : '#64748B';
  const emptyCol  = dark ? 'rgba(255,255,255,0.3)'  : '#94A3B8';
  const grpHdrBdr = dark ? 'rgba(255,255,255,0.06)' : '#E2E8F0';
  const grpNumCol = dark ? 'rgba(255,255,255,0.35)' : '#94A3B8';
  const grpItmCol = dark ? 'rgba(255,255,255,0.35)' : '#94A3B8';
  const totColMut = dark ? 'rgba(255,255,255,0.5)'  : '#64748B';
  const totColPri = dark ? '#fff'                   : '#0F172A';
  const divLine   = dark ? 'rgba(255,255,255,0.07)' : '#E2E8F0';
  const noteCol   = dark ? 'rgba(255,255,255,0.55)' : '#475569';
  const fineCol   = dark ? 'rgba(255,255,255,0.28)' : '#94A3B8';

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 150, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)' }} />
      )}

      {/* Drawer */}
      <div
        className={open ? 'store-slide-in' : ''}
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: 400, zIndex: 160,
          background: drawerBg,
          borderLeft: `1px solid ${drawerBdr}`,
          display: 'flex', flexDirection: 'column',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: open ? 'none' : 'transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)',
          boxShadow: dark ? 'none' : '-8px 0 32px rgba(0,0,0,0.1)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 20px 16px', borderBottom: `1px solid ${drawerBdr}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(20,184,166,0.15)', border: '1px solid rgba(20,184,166,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={17} color="#14B8A6" />
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 800, color: headCol }}>Your Cart</p>
              <p style={{ fontSize: 11, color: subCol }}>
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
                {partnerGroups.length > 1 && ` · ${partnerGroups.length} partners`}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${closeBdr}`, background: closeBg, color: closeCol, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={15} />
          </button>
        </div>

        {/* Items grouped by partner */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px' }}>
          {!cart?.items?.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, color: emptyCol }}>
              <ShoppingBag size={48} strokeWidth={1} />
              <p style={{ fontSize: 15, fontWeight: 600 }}>Your cart is empty</p>
              <p style={{ fontSize: 12 }}>Add some healthy products!</p>
            </div>
          ) : (
            partnerGroups.map((group, gIdx) => {
              const ps = PARTNER_STYLE[group.partner] || { cls: 'partner-healthkart', emoji: '🏪', color: '#14B8A6' };
              return (
                <div key={group.partner} style={{ marginBottom: gIdx < partnerGroups.length - 1 ? 4 : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0 6px', borderBottom: `1px solid ${grpHdrBdr}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: grpNumCol, textTransform: 'uppercase', letterSpacing: '0.06em', width: 22, textAlign: 'center' }}>{gIdx + 1}</span>
                      <span className={ps.cls} style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 6, border: '1px solid' }}>{ps.emoji} {group.partner}</span>
                      <span style={{ fontSize: 10, color: grpItmCol }}>{group.items.length} {group.items.length === 1 ? 'item' : 'items'}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: ps.color }}>₹{group.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  {group.items.map(item => (
                    <CartItemRow key={item.id} item={item} onUpdate={onUpdate} onRemove={onRemove} dark={dark} />
                  ))}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {cart?.items?.length > 0 && (
          <div style={{ padding: '16px 20px 24px', borderTop: `1px solid ${drawerBdr}`, background: footerBg }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: totColMut }}>Subtotal</span>
                <span style={{ fontSize: 13, color: totColPri, fontWeight: 600 }}>₹{total.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: totColMut }}>Delivery Fee ({partnerGroups.length} {partnerGroups.length === 1 ? 'partner' : 'partners'})</span>
                <span style={{ fontSize: 13, color: totColPri, fontWeight: 600 }}>₹{totalDeliveryFee}</span>
              </div>
              <div style={{ height: 1, background: divLine, margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 15, color: totColPri, fontWeight: 800 }}>Total</span>
                <span style={{ fontSize: 17, color: '#14B8A6', fontWeight: 800 }}>₹{(total + totalDeliveryFee).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {partnerGroups.length > 1 && (
              <div style={{ background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.2)', borderRadius: 8, padding: '8px 12px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>📦</span>
                <p style={{ fontSize: 11, color: noteCol, lineHeight: 1.5 }}>
                  Your order spans <strong style={{ color: '#14B8A6' }}>{partnerGroups.length} partners</strong>. Each partner's page will open in a separate tab.
                </p>
              </div>
            )}

            <button
              onClick={onCheckout}
              disabled={checkingOut}
              style={{ width: '100%', height: 46, borderRadius: 12, border: 'none', background: checkingOut ? 'rgba(13,148,136,0.5)' : 'linear-gradient(135deg, #0D9488, #14B8A6)', color: '#fff', fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: checkingOut ? 'not-allowed' : 'pointer', transition: 'opacity 200ms' }}
              onMouseEnter={e => { if (!checkingOut) e.currentTarget.style.opacity = '0.9'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
            >
              <CreditCard size={16} />
              {checkingOut ? 'Redirecting...' : `Checkout (${partnerGroups.length} ${partnerGroups.length === 1 ? 'partner' : 'partners'})`}
            </button>

            <p style={{ fontSize: 10, color: fineCol, textAlign: 'center', marginTop: 10 }}>
              You will be redirected to each partner's platform to complete payment.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
