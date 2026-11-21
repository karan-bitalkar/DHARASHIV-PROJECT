import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import toast from 'react-hot-toast';
import './AdminPanel.css';

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '▦' },
  { id: 'analytics', label: 'Analytics', icon: '▥' },
  { id: 'products', label: 'Products', icon: '◇' },
  { id: 'categories', label: 'Categories', icon: '◇' },
  { id: 'inventory', label: 'Inventory', icon: '▤' },
  { id: 'orders', label: 'Orders', icon: '▣' },
  { id: 'customers', label: 'Customers', icon: '♙' },
  { id: 'payments', label: 'Payments', icon: '₹' },
  { id: 'returns', label: 'Returns', icon: '↶' },
  { id: 'refunds', label: 'Refunds', icon: '₹' },
  { id: 'reviews', label: 'Reviews', icon: '☆' },
  { id: 'banners', label: 'Banners', icon: '▧' },
  { id: 'notifications', label: 'Notifications', icon: '♧' },
  { id: 'website-content', label: 'Edit Website Content', icon: '✎' },
  { id: 'settings', label: 'Settings', icon: '⚙' }
];

const AdminLayout = ({ children, activeTab, searchQuery, onSearchChange }) => {
  const { adminUser, adminLogout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [logoutConfirmationOpen, setLogoutConfirmationOpen] = useState(false);

  useEffect(() => {
    if (!logoutConfirmationOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setLogoutConfirmationOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [logoutConfirmationOpen]);

  const handleLogout = () => {
    adminLogout();
    toast.success('Admin logged out successfully');
    navigate('/admin/login', { replace: true });
    setLogoutConfirmationOpen(false);
  };

  const handleNavigation = (tab) => {
    navigate(`/admin/${tab === 'dashboard' ? 'dashboard' : tab}`);
    setSidebarOpen(false);
  };

  const toggleSidebar = () => {
    if (window.matchMedia('(max-width: 1024px)').matches) {
      setSidebarOpen((open) => !open);
      return;
    }
    setSidebarCollapsed((collapsed) => !collapsed);
  };

  return (
    <div className={`admin-shell${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      {sidebarOpen && <button className="admin-sidebar-scrim" onClick={() => setSidebarOpen(false)} aria-label="Close admin menu" />}
      <aside className={`admin-sidebar${sidebarOpen ? ' is-open' : ''}`}>
        <div className="admin-brand">
          <div className="admin-brand-logo"><img src="/protinut-logo.png" alt="PROTINUT" /></div>
          <div className="admin-brand-caption"><span>ADMIN PANEL</span></div>
        </div>
        <nav className="admin-sidebar-nav" aria-label="Admin navigation">
          {navigationItems.map((item) => (
            <button
              type="button"
              key={item.id}
              className={`admin-nav-link${activeTab === item.id ? ' is-active' : ''}`}
              title={sidebarCollapsed ? item.label : undefined}
              onClick={() => handleNavigation(item.id)}
            >
              <span className="admin-nav-icon" aria-hidden="true">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-bottom">
          <div className="admin-sidebar-user">
            <span className="admin-avatar">{adminUser?.name?.slice(0, 1) || 'A'}</span>
            <span><strong>{adminUser?.name || 'Admin'}</strong><small>Administrator</small></span>
          </div>
          <button type="button" className="admin-logout-button" title={sidebarCollapsed ? 'Logout' : undefined} onClick={() => setLogoutConfirmationOpen(true)}>
            <span aria-hidden="true">↪</span> Logout
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <button type="button" className="admin-menu-toggle" onClick={toggleSidebar} aria-label="Toggle admin sidebar" aria-expanded={!sidebarCollapsed || sidebarOpen}>☰</button>
          <label className="admin-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              aria-label="Search products, orders, customers"
              placeholder="Search products, orders, customers..."
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </label>
          <button type="button" className="admin-notification-button" onClick={() => toast('You are all caught up.') } aria-label="Notifications">♧<i /></button>
          <div className="admin-profile">
            <span className="admin-avatar">{adminUser?.name?.slice(0, 1) || 'A'}</span>
            <span>Admin</span>
          </div>
        </header>
        <main className="admin-content">{children}</main>
      </div>
      {logoutConfirmationOpen && (
        <div
          className="admin-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setLogoutConfirmationOpen(false);
          }}
        >
          <section className="admin-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="admin-logout-title">
            <div className="admin-confirm-icon" aria-hidden="true">↪</div>
            <h2 id="admin-logout-title">Are you sure you want to logout?</h2>
            <p>You will need to sign in again to access the Admin Panel.</p>
            <div className="admin-form-actions">
              <button type="button" className="admin-button secondary" onClick={() => setLogoutConfirmationOpen(false)}>Cancel</button>
              <button type="button" className="admin-button danger" onClick={handleLogout}>Yes, logout</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;
