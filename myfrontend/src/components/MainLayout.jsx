import { useState, useRef, useEffect } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function MainLayout({ children, dark, setDark, profileData, activeNav, onNavigate, onLogout, onUpgrade, onOpenReport, cartCount = 0 }) {
  const { name = '', category = '', photo = null } = profileData || {};
  const [collapsed, setCollapsed] = useState(false);
  const scrollRef = useRef(null);

  // Scroll content area to top whenever the active view changes
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [activeNav]);

  return (
    <div className={`min-h-screen flex ${dark ? 'bg-slate-950 text-white' : 'bg-[#FAFBFC] text-slate-900'} transition-colors duration-300`}>
      <Sidebar
        dark={dark}
        name={name}
        category={category}
        photo={photo}
        activeNav={activeNav}
        setActiveNav={onNavigate}
        onLogout={onLogout}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        cartCount={cartCount}
      />
      <main
        className="flex-1 flex flex-col overflow-hidden"
        style={{ marginLeft: collapsed ? '68px' : '232px', height: '100vh', transition: 'margin-left 280ms cubic-bezier(0.4, 0, 0.2, 1)' }}
      >
        {activeNav !== 'nia' && (
          <Navbar dark={dark} setDark={setDark} name={name} onUpgrade={onUpgrade} onOpenReport={onOpenReport} />
        )}
        <div ref={scrollRef} className={`flex-1 ${activeNav === 'nia' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          {children}
        </div>
      </main>
    </div>
  );
}
