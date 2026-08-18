import { useMemo } from 'react';
import { ClipboardList, ExternalLink, Package } from 'lucide-react';

const PARTNER_STYLE = {
  'Blinkit':          { cls: 'partner-blinkit',   emoji: '🟢', color: '#92C739' },
  'Zepto':            { cls: 'partner-zepto',      emoji: '🟣', color: '#A855F7' },
  'Swiggy Instamart': { cls: 'partner-swiggy',     emoji: '🟠', color: '#FC8019' },
  'Zomato':           { cls: 'partner-zomato',     emoji: '🔴', color: '#E13737' },
  'HealthKart':       { cls: 'partner-healthkart', emoji: '🩵', color: '#14B8A6' },
};

function StatusBadge({ status }) {
  const styles = {
    redirected: { bg: 'rgba(99,102,241,0.15)', color: '#818CF8', border: 'rgba(99,102,241,0.3)', label: 'Redirected to Partner' },
    completed:  { bg: 'rgba(20,184,166,0.15)', color: '#14B8A6', border: 'rgba(20,184,166,0.3)', label: 'Completed' },
  };
  const s = styles[status] || styles.redirected;
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {s.label}
    </span>
  );
}

function usePartnerBreakdown(products) {
  return useMemo(() => {
    if (!products?.length) return [];
    const map = {}, order = [];
    for (const p of products) {
      const pn = p.partner_name || 'Unknown';
      if (!map[pn]) { map[pn] = { partner: pn, items: [], subtotal: 0, affiliate_link: p.affiliate_link || null }; order.push(pn); }
      map[pn].items.push(p);
      map[pn].subtotal += Number(p.subtotal || 0);
    }
    return order.map(pn => map[pn]);
  }, [products]);
}

function PartnerSection({ group, dark }) {
  const ps = PARTNER_STYLE[group.partner] || { cls: 'partner-healthkart', emoji: '🏪', color: '#14B8A6' };
  const ptnHdrBg  = dark ? 'rgba(255,255,255,0.02)' : '#F8FAFC';
  const ptnItmCol = dark ? 'rgba(255,255,255,0.35)' : '#94A3B8';
  const namCol    = dark ? 'rgba(255,255,255,0.65)' : '#475569';
  const divLine   = dark ? 'rgba(255,255,255,0.04)' : '#F1F5F9';
  const itemPriCol= dark ? '#fff'                   : '#0F172A';

  return (
    <div style={{ marginBottom: 2 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px 8px', background: ptnHdrBg }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Package size={13} color={ps.color} />
          <span className={ps.cls} style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, border: '1px solid' }}>
            {ps.emoji} {group.partner}
          </span>
          <span style={{ fontSize: 10, color: ptnItmCol }}>{group.items.length} {group.items.length === 1 ? 'item' : 'items'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: ps.color }}>₹{group.subtotal.toLocaleString('en-IN')}</span>
          {group.affiliate_link && (
            <a
              href={group.affiliate_link}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, color: '#14B8A6', padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(20,184,166,0.3)', background: 'rgba(20,184,166,0.08)', textDecoration: 'none', transition: 'background 150ms' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(20,184,166,0.18)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(20,184,166,0.08)'; }}
            >
              <ExternalLink size={10} /> Open
            </a>
          )}
        </div>
      </div>

      {group.items.map((p, idx) => (
        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 14px 7px 36px', borderBottom: idx < group.items.length - 1 ? `1px solid ${divLine}` : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {p.image_url && (
              <img src={p.image_url} alt={p.name} style={{ width: 30, height: 30, borderRadius: 6, objectFit: 'cover' }} />
            )}
            <span style={{ fontSize: 12, color: namCol, fontWeight: 500 }}>{p.name}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <span style={{ fontSize: 10, color: ptnItmCol }}>x{p.quantity}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: itemPriCol }}>₹{Number(p.subtotal).toLocaleString('en-IN')}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function OrderCard({ order, dark }) {
  const partnerGroups = usePartnerBreakdown(order.products);
  const uniquePartners = partnerGroups.map(g => g.partner);

  const cardBg    = dark ? '#1E293B'                  : '#FFFFFF';
  const cardBdr   = dark ? 'rgba(255,255,255,0.08)'   : '#E2E8F0';
  const headBdr   = dark ? 'rgba(255,255,255,0.06)'   : '#F1F5F9';
  const namCol    = dark ? '#fff'                     : '#0F172A';
  const dateCol   = dark ? 'rgba(255,255,255,0.4)'    : '#94A3B8';
  const itemAreaBg= dark ? 'rgba(255,255,255,0.02)'   : '#FAFAFA';
  const itemAreaBdr=dark ? 'rgba(255,255,255,0.06)'   : '#F1F5F9';
  const totLab    = dark ? 'rgba(255,255,255,0.4)'    : '#94A3B8';
  const splitCol  = dark ? 'rgba(255,255,255,0.3)'    : '#94A3B8';

  const date = new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const time = new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ background: cardBg, border: `1px solid ${cardBdr}`, borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: dark ? 'none' : '0 1px 4px rgba(0,0,0,0.06)' }}>
      {/* Order header */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, borderBottom: `1px solid ${headBdr}` }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 800, color: namCol, marginBottom: 3 }}>Order #{order.id}</p>
          <p style={{ fontSize: 11, color: dateCol }}>{date} at {time}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <StatusBadge status={order.status} />
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {uniquePartners.map(pn => {
              const ps = PARTNER_STYLE[pn] || { cls: 'partner-healthkart', emoji: '🏪' };
              return (
                <span key={pn} className={ps.cls} style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 5, border: '1px solid' }}>
                  {ps.emoji} {pn}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Partner-grouped items */}
      <div style={{ background: itemAreaBg, borderBottom: `1px solid ${itemAreaBdr}` }}>
        {partnerGroups.map(group => (
          <PartnerSection key={group.partner} group={group} dark={dark} />
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontSize: 12, color: totLab }}>Total  </span>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#14B8A6' }}>₹{Number(order.total_price).toLocaleString('en-IN')}</span>
        </div>
        {uniquePartners.length > 1 && (
          <span style={{ fontSize: 10, color: splitCol, fontStyle: 'italic' }}>Split across {uniquePartners.length} partners</span>
        )}
      </div>
    </div>
  );
}

export default function OrderHistory({ orders, loading, dark = true }) {
  const emptyCol     = dark ? 'rgba(255,255,255,0.3)' : '#94A3B8';
  const emptyTextCol = dark ? 'rgba(255,255,255,0.5)' : '#64748B';
  const emptySubCol  = dark ? 'rgba(255,255,255,0.35)': '#94A3B8';

  if (loading) {
    return (
      <div style={{ display: 'grid', gap: 14 }}>
        {[1,2,3].map(i => (
          <div key={i} className={dark ? 'store-shimmer' : 'store-shimmer-light'} style={{ height: 140, borderRadius: 14 }} />
        ))}
      </div>
    );
  }

  if (!orders?.length) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', gap: 14, color: emptyCol }}>
        <ClipboardList size={52} strokeWidth={1} />
        <p style={{ fontSize: 16, fontWeight: 600, color: emptyTextCol }}>No orders yet</p>
        <p style={{ fontSize: 13, textAlign: 'center', color: emptySubCol }}>
          Your affiliate order history will appear here after you checkout.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {orders.map(order => (
        <OrderCard key={order.id} order={order} dark={dark} />
      ))}
    </div>
  );
}
