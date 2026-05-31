import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { menuConfig } from '../navigation/menuConfig';
import type { NavigationItem } from '../types/navigation';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Track expanded state of sections (submenus) by their label
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

  // Auto-expand parent submenus if a child route is currently active
  useEffect(() => {
    const activeParent = menuConfig.find((item) => 
      item.children?.some((child) => child.path === location.pathname)
    );
    if (activeParent) {
      setExpandedMenus((prev) => ({ ...prev, [activeParent.label]: true }));
    }
  }, [location.pathname]);

  const handleMenuClick = (item: NavigationItem) => {
    if (item.children) {
      // Toggle expanded submenu
      setExpandedMenus((prev) => ({
        ...prev,
        [item.label]: !prev[item.label]
      }));
    } else if (item.path) {
      navigate(item.path);
      onCloseMobile(); // Close mobile overlay drawer
    }
  };

  const isItemActive = (item: NavigationItem): boolean => {
    if (item.path) return location.pathname === item.path;
    if (item.children) {
      return item.children.some((child) => location.pathname === child.path);
    }
    return false;
  };

  const isChildActive = (child: NavigationItem): boolean => {
    return location.pathname === child.path;
  };

  const renderSidebarContent = () => (
    <div className="flex h-full w-full flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800/80 text-left transition-colors duration-300">
      
      {/* BRAND HEADER LOGO */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/25">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 shadow-md shadow-indigo-600/20">
            <span className="font-extrabold text-white text-md">M</span>
          </div>
          {!isCollapsed && (
            <span className="font-bold text-sm text-slate-800 dark:text-slate-100 tracking-wider uppercase animate-fadeIn truncate">
              Módulo IAM
            </span>
          )}
        </div>
        
        {/* Toggle Collapse Button (Desktop Only) */}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50 cursor-pointer focus:outline-none transition-colors"
        >
          {isCollapsed ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          )}
        </button>
      </div>

      {/* NAVIGATION LINKS LIST */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 select-none custom-scrollbar">
        {menuConfig.map((item) => {
          const active = isItemActive(item);
          const expanded = expandedMenus[item.label];
          
          return (
            <div key={item.label} className="w-full">
              {/* Parent Navigation Item */}
              <button
                type="button"
                onClick={() => handleMenuClick(item)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer focus:outline-none
                  ${active 
                    ? 'bg-indigo-50 dark:bg-indigo-600/15 text-indigo-600 dark:text-indigo-300' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/40'}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`shrink-0 ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                    {item.icon}
                  </span>
                  {!isCollapsed && <span className="animate-fadeIn truncate">{item.label}</span>}
                </div>

                {/* Submenu chevron trigger */}
                {item.children && !isCollapsed && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className={`w-3.5 h-3.5 opacity-60 transition-transform duration-300 ${expanded ? 'transform rotate-180' : ''}`}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                )}
              </button>

              {/* Nested Child Accordion Submenu */}
              {item.children && !isCollapsed && (
                <div className={`overflow-hidden transition-all duration-300 ease-out pl-6 ${expanded ? 'max-h-[500px] opacity-100 mt-1.5 space-y-1' : 'max-h-0 opacity-0'}`}>
                  {item.children.map((child) => {
                    const childActive = isChildActive(child);
                    return (
                      <button
                        key={child.label}
                        type="button"
                        onClick={() => handleMenuClick(child)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors duration-200 cursor-pointer focus:outline-none text-left
                          ${childActive 
                            ? 'text-indigo-600 dark:text-indigo-300 font-semibold' 
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/30'}`}
                      >
                        <span className={`shrink-0 ${childActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-600'}`}>
                          {child.icon}
                        </span>
                        <span className="truncate">{child.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* FOOTER METADATA */}
      {!isCollapsed && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-950/15 text-[10px] text-slate-500 animate-fadeIn truncate">
          v1.2.0 • Gestión IAM
        </div>
      )}

    </div>
  );

  return (
    <>
      {/* DESKTOP SIDEBAR DRAWER FRAME */}
      <aside className={`hidden md:block h-screen shrink-0 transition-all duration-300 z-30 ${isCollapsed ? 'w-18' : 'w-64'}`}>
        {renderSidebarContent()}
      </aside>

      {/* MOBILE DRAWER OVERLAY FRAME */}
      <div className={`fixed inset-0 z-50 md:hidden overflow-hidden transition-opacity duration-300 ${isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onCloseMobile} />
        
        <div className={`absolute inset-y-0 left-0 w-64 bg-white dark:bg-slate-900 shadow-2xl flex flex-col transition-transform duration-300 ease-out transform ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          {renderSidebarContent()}
        </div>
      </div>
    </>
  );
};
export default Sidebar;
