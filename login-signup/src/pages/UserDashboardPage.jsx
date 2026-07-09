import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import postingIllustration from '../assets/sb-admin/undraw_posting_photo.svg';
import profileIllustration from '../assets/sb-admin/undraw_profile.svg';
import './DashboardPage.css';

const draftStorageKey = 'geoboard-device-drafts';

function loadDrafts() {
  try {
    return JSON.parse(localStorage.getItem(draftStorageKey)) || [];
  } catch {
    return [];
  }
}

function UserStatCard({ title, value, accent, icon, note }) {
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

export default function UserDashboardPage() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [drafts, setDrafts] = useState(loadDrafts);

  const recentDrafts = useMemo(() => drafts.slice(0, 4), [drafts]);
  const deviceCount = drafts.length;
  const gateways = useMemo(
    () => new Set(drafts.map((draft) => draft.gatewayId).filter(Boolean)).size,
    [drafts]
  );

  const clearDrafts = () => {
    localStorage.removeItem(draftStorageKey);
    setDrafts([]);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={`sb-shell ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
      <aside className="sb-sidebar">
        <button className="sb-brand" type="button" onClick={() => navigate('/user-dashboard')}>
          <span className="sb-brand-mark">G</span>
          <span>GeoBoard</span>
        </button>

        <nav className="sb-nav" aria-label="User navigation">
          <button className="active" type="button" onClick={() => navigate('/user-dashboard')}>
            <span>D</span>
            Dashboard
          </button>
          <button type="button" onClick={() => navigate('/map-view')}>
            <span>M</span>
            Map View
          </button>
          <button type="button" onClick={() => navigate('/register-gateway')}>
            <span>G</span>
            Gateway
          </button>
          <button type="button" onClick={() => navigate('/devices')}>
            <span>T</span>
            Devices
          </button>
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
            <input type="search" placeholder="Search devices, gateways..." />
            <button type="button" aria-label="Search">Search</button>
          </label>

          <div className="sb-top-actions">
            <button type="button" aria-label="Notifications" className="sb-icon-button">
              !
              <span>{deviceCount}</span>
            </button>
            <div className="sb-user">
              <span>{user?.name || user?.email || 'User'}</span>
              <img src={profileIllustration} alt="" />
            </div>
            <button className="sb-logout" type="button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        <main className="sb-content">
          <div className="sb-page-title">
            <div>
              <h1>User Dashboard</h1>
              <p className="sb-page-subtitle">Track gateways, device drafts, and map activity from one place.</p>
            </div>
            <button type="button" onClick={() => navigate('/map-view')}>Open Map</button>
          </div>

          <section className="sb-stats-grid">
            <UserStatCard title="Device Drafts" value={deviceCount} accent="#4e73df" icon="T" note="saved locally" />
            <UserStatCard title="Linked Gateways" value={gateways} accent="#1cc88a" icon="G" note="from drafts" />
            <UserStatCard title="Map Mode" value="2D / 3D" accent="#36b9cc" icon="M" note="ready" />
            <UserStatCard title="Account Role" value="User" accent="#f6c23e" icon="U" note="standard access" />
          </section>

          <section className="sb-dashboard-grid user-dashboard-grid">
            <article className="sb-panel sb-wide">
              <div className="sb-panel-header">
                <h2>Quick Actions</h2>
              </div>
              <div className="user-action-grid">
                <button type="button" onClick={() => navigate('/map-view')}>
                  <strong>Open Map View</strong>
                  <span>Switch between 2D map and 3D city view.</span>
                </button>
                <button type="button" onClick={() => navigate('/register-gateway')}>
                  <strong>Register Gateway</strong>
                  <span>Add gateway details before connecting badges.</span>
                </button>
                <button type="button" onClick={() => navigate('/devices')}>
                  <strong>Add Devices</strong>
                  <span>Create and review badge/device drafts.</span>
                </button>
              </div>
            </article>

            <article className="sb-panel">
              <div className="sb-panel-header">
                <h2>Profile</h2>
              </div>
              <div className="user-profile-panel">
                <img src={profileIllustration} alt="" />
                <strong>{user?.name || 'Signed-in user'}</strong>
                <span>{user?.email || 'No email available'}</span>
              </div>
            </article>

            <article className="sb-panel">
              <div className="sb-panel-header">
                <h2>Recent Device Drafts</h2>
                {drafts.length > 0 && <button type="button" onClick={clearDrafts}>Clear</button>}
              </div>
              <div className="user-draft-list">
                {recentDrafts.length === 0 ? (
                  <p>No device drafts yet. Start by adding a badge or device.</p>
                ) : (
                  recentDrafts.map((draft) => (
                    <div className="user-draft-row" key={draft.id}>
                      <strong>{draft.name || draft.deviceId}</strong>
                      <span>{draft.gatewayId || 'No gateway'} | {draft.devEui || 'No DevEUI'}</span>
                    </div>
                  ))
                )}
              </div>
            </article>

            <article className="sb-panel">
              <div className="sb-panel-header">
                <h2>Workflow</h2>
              </div>
              <div className="user-workflow">
                <div><strong>1</strong><span>Register gateway</span></div>
                <div><strong>2</strong><span>Add device or badge</span></div>
                <div><strong>3</strong><span>View location on map</span></div>
              </div>
              <div className="sb-illustration">
                <img src={postingIllustration} alt="" />
              </div>
            </article>
          </section>
        </main>
      </div>
    </div>
  );
}
