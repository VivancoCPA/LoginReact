import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import ProfileDrawer from '../components/ProfileDrawer';

export const MainLayout: React.FC = () => {
  // Sidebar state configurations
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Theme states configuration (standard light / dark modes)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
    // Default to dark mode as ratifed by enterprise styling rules
    return 'dark';
  });

  // Apply theme configurations to document root dynamically
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleSidebarCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebar_collapsed', String(next));
      return next;
    });
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* LEFT DRAWER SIDEBAR */}
      <Sidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* RIGHT SIDE VIEWPORT (Header + Content viewport) */}
      <div className="flex flex-1 flex-col overflow-hidden">
        
        {/* TOPBAR HEADER NAVBAR */}
        <Topbar
          onToggleSidebar={() => {
            // Toggle overlay sidebar on mobile/tablet, collapse on desktop
            if (window.innerWidth < 768) {
              setIsMobileOpen(true);
            } else {
              toggleSidebarCollapse();
            }
          }}
          onOpenProfile={() => setIsProfileOpen(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        {/* DYNAMIC CONTENT OUTLET PANEL */}
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 transition-colors duration-300 p-6 md:p-8">
          <div className="mx-auto max-w-7xl h-full animate-fadeIn duration-200">
            <Outlet />
          </div>
        </main>

      </div>

      {/* PROFILE SLIDING RIGHT DRAWER */}
      <ProfileDrawer
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

    </div>
  );
};

export default MainLayout;
