import { Zap, Package, Clock } from 'lucide-react';

const STATS = [
  { icon: Package, value: '10+',   label: 'Products' },
  { icon: Zap,     value: '5',     label: 'Partners' },
  { icon: Clock,   value: '<20min', label: 'Avg Delivery' },
];

export default function StoreHero({ dark = true }) {
  const textMuted = dark ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.75)';

  return (
    <div style={{
      position: 'relative',
      borderRadius: 20,
      overflow: 'hidden',
      marginBottom: 28,
      background: dark
        ? 'linear-gradient(135deg, #0D9488 0%, #0F172A 55%, #1E293B 100%)'
        : 'linear-gradient(135deg, #0D9488 0%, #134E4A 55%, #0F766E 100%)',
      border: '1px solid rgba(20,184,166,0.25)',
      padding: '36px 40px',
    }}>
      {/* Decorative glow circles */}
      <div style={{ position: 'absolute', top: -60, right: -60, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(20,184,166,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -80, left: '40%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(13,148,136,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Tag */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(20,184,166,0.25)', border: '1px solid rgba(20,184,166,0.5)', borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 700, color: '#5EEAD4', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
          <span className="store-hero-float" style={{ fontSize: 14 }}>🛒</span>
          Affiliate Marketplace
        </div>

        {/* Headline */}
        <h2 style={{ fontSize: 28, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 10, maxWidth: 520 }}>
          Partnered Health &amp; Nutrition
          <span style={{ display: 'block', background: 'linear-gradient(90deg, #14B8A6, #5EEAD4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Marketplace
          </span>
        </h2>

        <p style={{ fontSize: 14, color: textMuted, marginBottom: 28, maxWidth: 460, lineHeight: 1.6 }}>
          Delivered via Quick-Commerce partners — Blinkit, Zepto, Swiggy Instamart,
          Zomato &amp; HealthKart. Shop high-protein, organic, and healthy products, fast.
        </p>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
          {STATS.map(({ icon: Icon, value, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(20,184,166,0.2)', border: '1px solid rgba(20,184,166,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={17} color="#14B8A6" />
              </div>
              <div>
                <p style={{ fontSize: 18, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{value}</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
