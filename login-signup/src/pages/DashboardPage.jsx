import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import postingIllustration from '../assets/sb-admin/undraw_posting_photo.svg';
import profileIllustration from '../assets/sb-admin/undraw_profile.svg';
import './DashboardPage.css';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

const navItems = [
  { label: 'Dashboard', to: '/dashboard', icon: 'D' },
  { label: 'Users', to: '/admin/users', icon: 'U', admin: true },
  { label: 'Roles', to: '/admin/roles', icon: 'R', admin: true },
  { label: 'Permissions', to: '/admin/role-permissions', icon: 'P', admin: true },
  { label: 'Email Templates', to: '/admin/email', icon: 'E', admin: true },
  { label: 'Map View', to: '/map-view', icon: 'M' },
  { label: 'Gateway', to: '/register-gateway', icon: 'G' },
  { label: 'Devices', to: '/devices', icon: 'T' },
];

const projectRows = [
  { label: 'Server Migration', value: 20, color: '#e74a3b' },
  { label: 'Sales Tracking', value: 40, color: '#f6c23e' },
  { label: 'Customer Database', value: 60, color: '#4e73df' },
  { label: 'Payout Details', value: 80, color: '#36b9cc' },
  { label: 'Account Setup', value: 100, color: '#1cc88a' },
];

function getRoleName(role) {
  if (!role) return 'User';
  return typeof role === 'string' ? role : role.name || 'User';
}

function StatCard({ title, value, accent, icon, note }) {
  return (
    <section className="sb-stat-card" style={{ '--accent': accent }}>
      <div>
        <p>{title}</p>
        <strong>{value}</strong>
        {note && <span>{note}</span>}
      </div>
      <div className="sb-stat-icon" aria-hidden="true">
        {icon}
      </div>
    </section>
  );
}

function AreaChart() {
  const points = '0,170 60,120 120,145 180,90 240,120 300,65 360,95 420,48 480,82 540,28 600,62 660,8';
  return (
    <div className="sb-chart sb-area-chart" aria-label="Earnings overview chart">
      <div className="sb-chart-grid" />
      <svg viewBox="0 0 660 190" preserveAspectRatio="none" role="img">
        <defs>
          <linearGradient id="areaFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#4e73df" stopOpacity="0.26" />
            <stop offset="100%" stopColor="#4e73df" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={`M ${points} L 660 190 L 0 190 Z`} fill="url(#areaFill)" />
        <polyline points={points} fill="none" stroke="#4e73df" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        {points.split(' ').map((point) => {
          const [cx, cy] = point.split(',');
          return <circle key={point} cx={cx} cy={cy} r="5" fill="#4e73df" stroke="#fff" strokeWidth="3" />;
        })}
      </svg>
      <div className="sb-chart-months">
        <span>Jan</span>
        <span>Mar</span>
        <span>May</span>
        <span>Jul</span>
        <span>Sep</span>
        <span>Nov</span>
      </div>
    </div>
  );
}

function DonutChart() {
  return (
    <div className="sb-donut-wrap" aria-label="Revenue sources chart">
      <div className="sb-donut" />
      <div className="sb-donut-legend">
        <span><i className="direct" /> Direct</span>
        <span><i className="social" /> Social</span>
        <span><i className="referral" /> Referral</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { logout, user, token } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');

  const roleName = getRoleName(user?.role);
  const isAdmin = roleName.toLowerCase() === 'admin';

  useEffect(() => {
    const fetchUsers = async () => {
      if (!isAdmin || !token) return;

      setUsersLoading(true);
      setUsersError('');

      try {
        const res = await fetch(`${API_BASE}/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Failed to fetch users');
        }

        setUsers(data.users || []);
      } catch (error) {
        setUsersError(error.message || 'Failed to fetch users');
      } finally {
        setUsersLoading(false);
      }
    };

    fetchUsers();
  }, [isAdmin, token]);

  const userMetrics = useMemo(() => {
    const admins = users.filter((item) => getRoleName(item.role).toLowerCase() === 'admin').length;
    return {
      total: users.length,
      admins,
      members: Math.max(users.length - admins, 0),
    };
  }, [users]);

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

        <nav className="sb-nav" aria-label="Dashboard navigation">
          {navItems
            .filter((item) => !item.admin || isAdmin)
            .map((item) => (
              <button
                className={item.to === '/dashboard' ? 'active' : ''}
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
            <input type="search" placeholder="Search for..." />
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
              <span>{user?.name || user?.email || 'Valerie Luna'}</span>
              <img src={profileIllustration} alt="" />
            </div>
            <button className="sb-logout" type="button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        <main className="sb-content">
          <div className="sb-page-title">
            <h1>Dashboard</h1>
            <button type="button">Generate Report</button>
          </div>

          <section className="sb-stats-grid">
            <StatCard title="Earnings (Monthly)" value="$40,000" accent="#4e73df" icon="$" />
            <StatCard title="Earnings (Annual)" value="$215,000" accent="#1cc88a" icon="$" />
            <StatCard title="Tasks" value="50%" accent="#36b9cc" icon="%" note="half complete" />
            <StatCard title="Pending Requests" value={isAdmin ? userMetrics.total : '18'} accent="#f6c23e" icon="Q" note={isAdmin ? 'users loaded' : 'sample'} />
          </section>

          <section className="sb-dashboard-grid">
            <article className="sb-panel sb-wide">
              <div className="sb-panel-header">
                <h2>Earnings Overview</h2>
                <button type="button" aria-label="More options">...</button>
              </div>
              <AreaChart />
            </article>

            <article className="sb-panel">
              <div className="sb-panel-header">
                <h2>Revenue Sources</h2>
                <button type="button" aria-label="More options">...</button>
              </div>
              <DonutChart />
            </article>

            <article className="sb-panel">
              <div className="sb-panel-header">
                <h2>Projects</h2>
              </div>
              <div className="sb-projects">
                {projectRows.map((project) => (
                  <div className="sb-project" key={project.label}>
                    <div>
                      <span>{project.label}</span>
                      <strong>{project.value}%</strong>
                    </div>
                    <div className="sb-progress">
                      <i style={{ width: `${project.value}%`, background: project.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="sb-panel">
              <div className="sb-panel-header">
                <h2>Illustrations</h2>
              </div>
              <div className="sb-illustration">
                <img src={postingIllustration} alt="" />
                <p>
                  This dashboard uses the SB Admin 2 visual language from the provided zip file, adapted into the React app.
                </p>
              </div>
            </article>

            {isAdmin && (
              <article className="sb-panel sb-admin-panel">
                <div className="sb-panel-header">
                  <h2>Admin Overview</h2>
                  <button type="button" onClick={() => navigate('/admin/users')}>Manage Users</button>
                </div>
                {usersError ? (
                  <div className="sb-alert">{usersError}</div>
                ) : (
                  <div className="sb-admin-summary">
                    <div><strong>{usersLoading ? '...' : userMetrics.total}</strong><span>Total Users</span></div>
                    <div><strong>{usersLoading ? '...' : userMetrics.admins}</strong><span>Admins</span></div>
                    <div><strong>{usersLoading ? '...' : userMetrics.members}</strong><span>Members</span></div>
                  </div>
                )}
              </article>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
