import React, { useState, useEffect } from "react";

import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import Map3D from "../Components/Map3D";



// Fix Leaflet's broken default icon in CRA
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// ─── Map tile configurations ────────────────────────────────────────────────
const MAP_LAYERS = {
  "2D Street": {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    label: "2D",
    icon: "🗺️",
  },
  "2D Topo": {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution:
      'Map data: &copy; <a href="https://openstreetmap.org">OpenStreetMap</a>, <a href="https://opentopomap.org">OpenTopoMap</a>',
    label: "Topo",
    icon: "🏔️",
  },
  "3D Satellite": {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri &mdash; Source: Esri, USGS, NOAA",
    label: "3D",
    icon: "🛰️",
  },
  "3D Hybrid": {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
    label: "Hybrid",
    icon: "🌐",
  },
};

// ─── Sample location pins ────────────────────────────────────────────────────
const LOCATIONS = [
  { id: 1, name: "New Delhi", lat: 28.6139, lng: 77.209, info: "Capital of India" },
  { id: 2, name: "Mumbai", lat: 19.076, lng: 72.8777, info: "Financial hub" },
  { id: 3, name: "Bangalore", lat: 12.9716, lng: 77.5946, info: "Silicon Valley of India" },
  { id: 4, name: "Kolkata", lat: 22.5726, lng: 88.3639, info: "City of Joy" },
];

// ─── Stats ───────────────────────────────────────────────────────────────────
const STATS = [
  { label: "Active Users", value: "1,284", delta: "+12%", color: "#10b981" },
  { label: "Locations", value: "48", delta: "+3", color: "#6366f1" },
  { label: "Alerts", value: "7", delta: "-2", color: "#f59e0b" },
  { label: "Uptime", value: "99.8%", delta: "stable", color: "#3b82f6" },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { logout, user, token } = useAuth();

  const isAdmin = user?.role?.name === 'Admin';

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');

  useEffect(() => {
        const fetchUsers = async () => {
      if (!isAdmin || !token) return;

      setUsersLoading(true);
      setUsersError('');

      try {
        const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
        const res = await fetch(`${API_BASE}/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Failed to fetch users');
        }

        setUsers(data.users || []);
      } catch (e) {
        setUsersError(e.message || 'Failed to fetch users');
      } finally {
        setUsersLoading(false);
      }
    };

    fetchUsers();
  }, [isAdmin, token]);


  const [activeLayer, setActiveLayer] = useState("2D Street");

  const [is3D, setIs3D] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [time, setTime] = useState(new Date());

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const layer = MAP_LAYERS[activeLayer];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };


  return (
    <div style={styles.root}>
      {/* ── Top Navbar ── */}
      <nav style={styles.navbar}>
        <div style={styles.navLeft}>
          <button
            style={styles.menuBtn}
            onClick={() => setSidebarOpen((v) => !v)}
            title="Toggle sidebar"
          >
            ☰
          </button>
          <span style={styles.brand}>📍 GeoBoard</span>
        </div>
        <div style={styles.navRight}>
          <span style={styles.clock}>
            {time.toLocaleTimeString("en-IN", { hour12: true })}
          </span>
          <div style={styles.avatar}>
            {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </nav>

      <div style={styles.body}>
        {/* ── Sidebar ── */}
        {sidebarOpen && (
          <aside style={styles.sidebar}>
            <p style={styles.sidebarTitle}>Map View</p>

            {/* View toggle buttons */}
            <div style={styles.viewToggleGroup}>
              <button
                style={{
                  ...styles.viewToggleBtn,
                  ...(is3D ? {} : styles.viewToggleBtnActive),
                }}
                onClick={() => {
                  setIs3D(false);
                  setActiveLayer("2D Street");
                }}
              >
                🗺️ 2D
              </button>
              <button
                style={{
                  ...styles.viewToggleBtn,
                  ...(is3D ? styles.viewToggleBtnActive : {}),
                }}
                onClick={() => {
                  setIs3D(true);
                  setActiveLayer("3D Satellite");
                }}
              >
                🛰️ 3D
              </button>
            </div>

            {/* Layer picker */}
            <p style={styles.sidebarSubTitle}>Layer Style</p>
            {Object.entries(MAP_LAYERS).map(([name, cfg]) => (
              <button
                key={name}
                style={{
                  ...styles.layerBtn,
                  ...(activeLayer === name ? styles.layerBtnActive : {}),
                }}
                onClick={() => setActiveLayer(name)}
              >
                <span style={{ fontSize: 18 }}>{cfg.icon}</span>
                <span>{name}</span>
              </button>
            ))}

            <hr style={styles.divider} />

            {/* Location list */}
            <p style={styles.sidebarSubTitle}>Pinned Locations</p>
            {LOCATIONS.map((loc) => (
              <div key={loc.id} style={styles.locItem}>
                <span style={styles.locDot} />
                <div>
                  <p style={styles.locName}>{loc.name}</p>
                  <p style={styles.locInfo}>{loc.info}</p>
                </div>
              </div>
            ))}
          </aside>
        )}

        {/* ── Main content ── */}
        <main style={styles.main}>
          {/* Stats row */}
          <div style={styles.statsRow}>
            {STATS.map((s) => (
              <div key={s.label} style={styles.statCard}>
                <p style={styles.statLabel}>{s.label}</p>
                <p style={styles.statValue}>{s.value}</p>
                <p style={{ ...styles.statDelta, color: s.color }}>{s.delta}</p>
              </div>
            ))}
          </div>

          {/* Two-column layout: Map (left) + Admin Users sidebar (right) */}
          <div style={styles.twoColLayout}>
            {/* Map card (left) */}
            <div style={{ ...styles.mapCard, flex: 1 }}>
              {/* Map header */}
              <div style={styles.mapHeader}>
                <div style={styles.mapTitleGroup}>
                  <span style={styles.mapTitle}>
                    {is3D ? "🛰️ 3D Satellite View" : "🗺️ 2D Street View"}
                  </span>
                  <span
                    style={{
                      ...styles.modeBadge,
                      background: is3D ? "#6366f1" : "#10b981",
                    }}
                  >
                    {is3D ? "SATELLITE" : "STREET"}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={styles.layerTag}>{activeLayer}</span>
                </div>
              </div>

              {/* 2D or 3D Map */}
              <div style={styles.mapWrapper}>
                {is3D ? (
                  <Map3D />
                ) : (
                  <MapContainer
                    center={[22.5, 78.9629]}
                    zoom={5}
                    style={{ width: "100%", height: "100%" }}
                    zoomControl={false}
                    key={activeLayer} // re-mount on layer change to avoid tile ghost
                  >
                    <TileLayer
                      url={layer.url}
                      attribution={layer.attribution}
                      maxZoom={18}
                    />
                    <ZoomControl position="bottomright" />
                    {LOCATIONS.map((loc) => (
                      <Marker key={loc.id} position={[loc.lat, loc.lng]}>
                        <Popup>
                          <strong>{loc.name}</strong>
                          <br />
                          {loc.info}
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                )}
              </div>

              {/* Map footer */}
              <div style={styles.mapFooter}>
                <span style={styles.footerText}>
                  📌 {LOCATIONS.length} locations pinned &nbsp;|&nbsp; Scroll to
                  zoom &nbsp;|&nbsp; Click markers for details
                </span>
              </div>
            </div>

            {/* Admin Users sidebar (right) */}
            {isAdmin ? (
              <aside style={styles.usersSidebar}>
                <div style={styles.usersSidebarHeader}>
                  <span style={styles.usersSidebarTitle}>🛡️ Admin - Users</span>
                  <span style={styles.usersSidebarBadge}>
                    {usersLoading ? 'LOADING' : `${users.length} USERS`}
                  </span>
                </div>

                <div style={styles.usersSidebarList}>
                  {usersError && (
                    <div style={{ color: '#fb7185', fontWeight: 600 }}>{usersError}</div>
                  )}

                  {!usersError && usersLoading && (
                    <div style={{ color: '#94a3b8' }}>Fetching users...</div>
                  )}

                  {!usersLoading && !usersError && (
                    <table style={styles.usersTable}>
                      <thead>
                        <tr>
                          <th style={styles.usersTh}>Name</th>
                          <th style={styles.usersTh}>Email</th>
                          <th style={styles.usersTh}>Role</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr key={u.id || u._id}>
                            <td style={styles.usersTd}>{u.name}</td>
                            <td style={styles.usersTd}>{u.email}</td>
                            <td style={styles.usersTd}>{u.role?.name || u.role || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </aside>
            ) : (
              <div style={{ width: 0 }} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = {
  logoutWrap: {
    display: 'flex',
    alignItems: 'center',
  },
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    background: "#0f172a",
    color: "#e2e8f0",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    overflow: "hidden",
  },
  navbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 20px",
    height: 56,
    background: "#1e293b",
    borderBottom: "1px solid #334155",
    flexShrink: 0,
    zIndex: 100,
  },
  navLeft: { display: "flex", alignItems: "center", gap: 12 },
  navRight: { display: "flex", alignItems: "center", gap: 16 },
  menuBtn: {
    background: "none",
    border: "none",
    color: "#94a3b8",
    fontSize: 20,
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: 6,
  },
  brand: { fontWeight: 700, fontSize: 18, letterSpacing: "-0.5px", color: "#f1f5f9" },
  clock: { fontSize: 13, color: "#94a3b8", fontVariantNumeric: "tabular-nums" },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 14,
    color: "#fff",
  },
  body: { display: "flex", flex: 1, overflow: "hidden" },
  sidebar: {
    width: 220,
    background: "#1e293b",
    borderRight: "1px solid #334155",
    padding: "16px 12px",
    overflowY: "auto",
    flexShrink: 0,
  },
  sidebarTitle: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.1em",
    color: "#64748b",
    textTransform: "uppercase",
    margin: "0 0 10px",
  },
  sidebarSubTitle: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.1em",
    color: "#64748b",
    textTransform: "uppercase",
    margin: "14px 0 8px",
  },
  viewToggleGroup: {
    display: "flex",
    gap: 6,
    marginBottom: 12,
  },
  viewToggleBtn: {
    flex: 1,
    padding: "7px 0",
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: 8,
    color: "#94a3b8",
    fontSize: 13,
    cursor: "pointer",
    fontWeight: 500,
    transition: "all 0.15s",
  },
  viewToggleBtnActive: {
    background: "#6366f1",
    border: "1px solid #6366f1",
    color: "#fff",
  },
  layerBtn: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "100%",
    padding: "8px 10px",
    background: "none",
    border: "1px solid transparent",
    borderRadius: 8,
    color: "#94a3b8",
    fontSize: 13,
    cursor: "pointer",
    textAlign: "left",
    marginBottom: 4,
    transition: "all 0.15s",
  },
  layerBtnActive: {
    background: "#0f172a",
    border: "1px solid #6366f1",
    color: "#e2e8f0",
  },
  divider: { border: "none", borderTop: "1px solid #334155", margin: "12px 0" },
  locItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 10,
  },
  locDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#10b981",
    marginTop: 4,
    flexShrink: 0,
  },
  locName: { margin: 0, fontSize: 13, fontWeight: 600, color: "#e2e8f0" },
  locInfo: { margin: 0, fontSize: 11, color: "#64748b" },

  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    padding: 16,
    gap: 14,
    overflow: "hidden",
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 12,
    flexShrink: 0,
  },
  statCard: {
    background: "#1e293b",
    borderRadius: 12,
    padding: "14px 16px",
    border: "1px solid #334155",
  },
  statLabel: { margin: 0, fontSize: 12, color: "#64748b", fontWeight: 500 },
  statValue: {
    margin: "4px 0 2px",
    fontSize: 22,
    fontWeight: 700,
    color: "#f1f5f9",
    letterSpacing: "-0.5px",
  },
  statDelta: { margin: 0, fontSize: 12, fontWeight: 600 },

  mapCard: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background: "#1e293b",
    borderRadius: 12,
    border: "1px solid #334155",
    overflow: "hidden",
    minHeight: 0,
  },
  mapHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 16px",
    borderBottom: "1px solid #334155",
    flexShrink: 0,
  },
  mapTitleGroup: { display: "flex", alignItems: "center", gap: 10 },
  mapTitle: { fontWeight: 600, fontSize: 15, color: "#f1f5f9" },
  modeBadge: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.08em",
    color: "#fff",
    padding: "2px 8px",
    borderRadius: 4,
  },
  layerTag: {
    fontSize: 12,
    color: "#94a3b8",
    background: "#0f172a",
    padding: "3px 10px",
    borderRadius: 20,
    border: "1px solid #334155",
  },
  mapWrapper: {
    flex: 1,
    minHeight: 0,
    position: "relative",
  },
  mapFooter: {
    padding: "8px 16px",
    background: "#0f172a",
    borderTop: "1px solid #334155",
    flexShrink: 0,
  },
  twoColLayout: {
    flex: 1,
    display: "flex",
    gap: 14,
    overflow: "hidden",
    minHeight: 0,
  },

  usersSidebar: {
    width: 320,
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 12,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
  },
  usersSidebarHeader: {
    padding: "10px 14px",
    borderBottom: "1px solid #334155",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  usersSidebarTitle: { fontWeight: 700, fontSize: 14 },
  usersSidebarBadge: {
    fontSize: 10,
    fontWeight: 700,
    color: "#fff",
    background: "#6366f1",
    padding: "2px 8px",
    borderRadius: 4,
  },
  usersSidebarList: {
    padding: 14,
    flex: 1,
    overflowY: "auto",
  },
  footerText: { fontSize: 12, color: "#64748b" },
  usersTable: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  usersTh: {
    textAlign: 'left',
    fontSize: 12,
    padding: '10px 8px',
    color: '#94a3b8',
    borderBottom: '1px solid #334155',
  },
  usersTd: {
    fontSize: 13,
    padding: '10px 8px',
    borderBottom: '1px solid rgba(51,65,85,0.6)',
    color: '#e2e8f0',
  },
  logoutBtn: {
    background: "#ff6b6b",

    border: "none",
    color: "#111827",
    fontWeight: 700,
    padding: "8px 12px",
    borderRadius: 8,
    cursor: "pointer",
    transition: "transform 0.06s ease, filter 0.15s ease",
  },
};