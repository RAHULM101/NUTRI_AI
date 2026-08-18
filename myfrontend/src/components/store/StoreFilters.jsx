import { Search, X } from 'lucide-react';

const CATEGORIES = [
  { label: 'All',            slug: '' },
  { label: 'High Protein',   slug: 'high-protein' },
  { label: 'Supplements',    slug: 'supplements' },
  { label: 'Healthy Snacks', slug: 'healthy-snacks' },
  { label: 'Organic Meals',  slug: 'organic-meals' },
  { label: 'Beverages',      slug: 'beverages' },
];

const PARTNERS = [
  { label: 'All Partners',     value: '' },
  { label: 'Blinkit',          value: 'Blinkit' },
  { label: 'Zepto',            value: 'Zepto' },
  { label: 'Swiggy Instamart', value: 'Swiggy Instamart' },
  { label: 'Zomato',           value: 'Zomato' },
  { label: 'HealthKart',       value: 'HealthKart' },
];

export default function StoreFilters({ dark = true, search, onSearch, category, onCategory, partner, onPartner }) {
  const inputBg     = dark ? '#1E293B'               : '#FFFFFF';
  const inputBorder = dark ? 'rgba(255,255,255,0.1)' : '#CBD5E1';
  const inputColor  = dark ? '#F1F5F9'               : '#0F172A';
  const inputPH     = dark ? 'rgba(255,255,255,0.35)': '#94A3B8';
  const labelCol    = dark ? 'rgba(255,255,255,0.4)' : '#94A3B8';
  const chipBg      = dark ? 'rgba(255,255,255,0.05)': '#F1F5F9';
  const chipBorder  = dark ? 'rgba(255,255,255,0.12)': '#CBD5E1';
  const chipColor   = dark ? 'rgba(255,255,255,0.6)' : '#475569';
  const clearBg     = dark ? 'rgba(255,255,255,0.1)' : '#E2E8F0';
  const clearCol    = dark ? '#fff'                  : '#475569';
  const hoverCol    = dark ? '#fff'                  : '#0F172A';

  return (
    <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 480 }}>
        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: inputPH, pointerEvents: 'none' }} />
        <input
          id="store-search-input"
          type="text"
          placeholder="Search products, brands, or macros..."
          value={search}
          onChange={e => onSearch(e.target.value)}
          style={{ width: '100%', background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 12, padding: '10px 40px 10px 40px', color: inputColor, fontSize: 14, outline: 'none', transition: 'border-color 200ms' }}
          onFocus={e => { e.target.style.borderColor = '#14B8A6'; }}
          onBlur={e  => { e.target.style.borderColor = inputBorder; }}
        />
        {search && (
          <button onClick={() => onSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: clearBg, border: 'none', borderRadius: 6, color: clearCol, cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px 4px' }}>
            <X size={13} />
          </button>
        )}
      </div>

      {/* Category chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: labelCol, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginRight: 4 }}>Category</span>
        {CATEGORIES.map(c => {
          const active = category === c.slug;
          return (
            <button
              key={c.slug}
              id={`store-cat-${c.slug || 'all'}`}
              onClick={() => onCategory(c.slug)}
              style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${active ? '#14B8A6' : chipBorder}`, background: active ? 'rgba(20,184,166,0.18)' : chipBg, color: active ? '#14B8A6' : chipColor, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 150ms', whiteSpace: 'nowrap' }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = 'rgba(20,184,166,0.4)'; e.currentTarget.style.color = hoverCol; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = chipBorder; e.currentTarget.style.color = chipColor; } }}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Partner filter */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: labelCol, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginRight: 4 }}>Delivery Via</span>
        {PARTNERS.map(p => {
          const active = partner === p.value;
          return (
            <button
              key={p.value}
              id={`store-partner-${p.value.replace(/\s+/g, '-').toLowerCase() || 'all'}`}
              onClick={() => onPartner(p.value)}
              style={{ padding: '5px 12px', borderRadius: 8, border: `1px solid ${active ? '#0D9488' : chipBorder}`, background: active ? 'rgba(13,148,136,0.15)' : chipBg, color: active ? '#0D9488' : chipColor, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 150ms', whiteSpace: 'nowrap' }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = 'rgba(13,148,136,0.4)'; e.currentTarget.style.color = hoverCol; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = chipBorder; e.currentTarget.style.color = chipColor; } }}
            >
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
