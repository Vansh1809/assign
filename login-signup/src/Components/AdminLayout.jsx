import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import profileIllustration from '../assets/sb-admin/undraw_profile.svg';
import '../pages/DashboardPage.css';

const adminNavItems = [
  { label: 'Dashboard', to: '/dashboard', icon: 'D' },
  { label: 'Users', to: '/admin/users', icon: 'U' },
  { label: 'Roles', to: '/admin/roles', icon: 'R' },
  { label: 'Permissions', to: '/admin/role-permissions', icon: 'P' },
  { label: 'Email Templates', to: '/admin/email', icon: 'E' },
  { label: 'Map View', to: '/map-view', icon: 'M' },
  { label: 'Gateway', to: '/register-gateway', icon: 'G' },
  { label: 'Devices', to: '/devices', icon: 'T' },
];

export default function AdminLayout({ children, title, subtitle, action, searchPlaceholder = 'Search for...' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);


  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={`sb-shell ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
      <aside className="sb-sidebar">
        <button className="sb-brand" type="button" onClick={() => navigate('/dashboard')}>
          <span className="sb-brand-mark">S</span>
          <span>SB Admin 2</span>
        </button>

        <nav className="sb-nav" aria-label="Admin navigation">
          {adminNavItems.map((item) => (
            <button
              className={location.pathname === item.to ? 'active' : ''}
              key={item.to}
              type="button"
              onClick={() => navigate(item.to)}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <button className="sb-collapse" type="button" onClick={() => setSidebarOpen((value) => !value)} aria-label="Toggle sidebar">
          &lt;
        </button>
      </aside>

      <div className="sb-main">
        <header className="sb-topbar">
          <button className="sb-menu" type="button" onClick={() => setSidebarOpen((value) => !value)} aria-label="Toggle menu">
            =
          </button>

          <label className="sb-search">
            <input type="search" placeholder={searchPlaceholder} />
            <button type="button" aria-label="Search">Search</button>
          </label>

          <div className="sb-top-actions">
            <button type="button" aria-label="Notifications" className="sb-icon-button">
              !
              <span>3+</span>
            </button>
            <button type="button" aria-label="Messages" className="sb-icon-button">
              M
              <span>7</span>
            </button>
            <div className="sb-user">
              <span>{user?.name || user?.email || 'Admin'}</span>
              <img src={profileIllustration} alt="" />
            </div>
            <button className="sb-logout" type="button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        <main className="sb-content">
          {(title || action) && (
            <div className="sb-page-title">
              <div>
                {title && <h1>{title}</h1>}
                {subtitle && <p className="sb-page-subtitle">{subtitle}</p>}
              </div>
              {action}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
