import { User, LogOut, LayoutDashboard, UtensilsCrossed, Bot, Menu, ChevronRight, Settings, ShoppingBag } from 'lucide-react';
import logo from '../assets/Screenshot_2026-05-08_184522-removebg-preview.png';

const LIGHT = { bg: '#0D9488', card: '#0F766E', border: 'rgba(255,255,255,0.15)' };
const DARK = { bg: '#0F172A', card: '#1E293B', border: 'rgba(255,255,255,0.06)' };

function NavItem({ icon: Icon, label, active, onClick, collapsed, badge }) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150"
      style={{
        justifyContent: collapsed ? 'center' : undefined,
        background: active ? 'rgba(255,255,255,0.18)' : 'transparent',
        color: active ? '#ffffff' : 'rgba(255,255,255,0.65)',
        border: active ? '1px solid rgba(255,255,255,0.22)' : '1px solid transparent',
        position: 'relative',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      <Icon size={16} className="shrink-0" style={{ color: active ? '#ffffff' : 'rgba(255,255,255,0.65)' }} />
      {!collapsed && <span className="truncate">{label}</span>}
      {!collapsed && active && <div className="ml-auto w-1.5 h-4 rounded-full" style={{ background: 'rgba(255,255,255,0.8)' }} />}
      {badge > 0 && (
        <span style={{
          position: 'absolute',
          top: 4, right: collapsed ? 4 : 8,
          minWidth: 16, height: 16, borderRadius: 8,
          background: '#14B8A6', color: '#fff',
          fontSize: 9, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 4px',
        }}>{badge}</span>
      )}
    </button>
  );
}

export default function Sidebar({ dark, name, category, photo, activeNav, setActiveNav, onLogout, collapsed, setCollapsed, cartCount = 0 }) {
  const C = dark ? DARK : LIGHT;
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'meal-logs', label: 'Meal Logs', icon: UtensilsCrossed },
    { id: 'nia', label: 'NIA', icon: Bot },
    { id: 'store', label: 'Nutri Store', icon: ShoppingBag, badge: cartCount },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      style={{
        position: 'fixed',
        top: 0, left: 0,
        height: '100vh',
        width: collapsed ? '68px' : '232px',
        background: C.bg,
        borderRight: `1px solid ${C.border}`,
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 280ms cubic-bezier(0.4, 0, 0.2, 1)',
        willChange: 'width',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px', borderBottom: `1px solid ${C.border}`, minHeight: '60px' }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
            <img src={logo} alt="NutriAI" style={{ height: 36, width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
            <span style={{ marginLeft: 'auto', padding: '2px 6px', borderRadius: 4, fontSize: 9, fontWeight: 700, color: '#fff', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', flexShrink: 0 }}>BETA</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          style={{
            marginLeft: collapsed ? 'auto' : 8,
            marginRight: collapsed ? 'auto' : 0,
            width: 32, height: 32, borderRadius: 8,
            border: 'none', background: 'transparent',
            color: 'rgba(255,255,255,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
            transition: 'background 150ms, color 150ms',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
        >
          {collapsed ? <Menu size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      {/* User card */}
      {!collapsed && (
        <div style={{ margin: '12px', padding: '12px', borderRadius: 12, background: C.card, border: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: 'rgba(20,184,166,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {photo
                ? <img src={photo} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <User size={15} color="#14B8A6" />
              }
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name || 'Your Name'}</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{category || 'NutriAI User'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {!collapsed && (
          <p style={{ padding: '0 12px', marginBottom: 6, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.45)' }}>Menu</p>
        )}
        {navItems.map(item => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            active={activeNav === item.id}
            onClick={() => setActiveNav(item.id)}
            collapsed={collapsed}
            badge={item.badge}
          />
        ))}

      </nav>

      {/* Logout */}
      <div style={{ padding: '8px', borderTop: `1px solid ${C.border}` }}>
        <button
          onClick={onLogout}
          title={collapsed ? 'Log Out' : undefined}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            justifyContent: collapsed ? 'center' : undefined,
            padding: '10px 12px', borderRadius: 12,
            border: 'none', background: 'transparent',
            color: '#F87171', fontSize: 14, fontWeight: 500,
            cursor: 'pointer', transition: 'background 150ms',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          <LogOut size={15} style={{ flexShrink: 0 }} />
          {!collapsed && 'Log Out'}
        </button>
      </div>
    </aside>
  );
}
