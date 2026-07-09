import React, { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import Map3D from '../Components/Map3D';
import profileIllustration from '../assets/sb-admin/undraw_profile.svg';
import './DashboardPage.css';
import './MapViewPage.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const MAP_LAYERS = {
  '2D Street': {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    icon: '2D',
  },
  '2D Topo': {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data: &copy; <a href="https://openstreetmap.org">OpenStreetMap</a>, <a href="https://opentopomap.org">OpenTopoMap</a>',
    icon: 'TP',
  },
  '3D Satellite': {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
    icon: '3D',
  },
  '3D Hybrid': {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
    icon: 'HY',
  },
};

const LOCATIONS = [];

export default function MapViewPage() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [activeLayer, setActiveLayer] = useState('2D Street');
  const [is3D, setIs3D] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [time, setTime] = useState(new Date());

  const roleName = user?.role?.name || user?.role || '';
  const isAdmin = roleName.toLowerCase() === 'admin';
  const homeRoute = isAdmin ? '/dashboard' : '/user-dashboard';
  const layer = MAP_LAYERS[activeLayer];

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={`sb-shell ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
      <aside className="sb-sidebar">
        <button className="sb-brand" type="button" onClick={() => navigate(homeRoute)}>
          <span className="sb-brand-mark">G</span>
          <span>GeoBoard</span>
        </button>

        <nav className="sb-nav" aria-label="Map navigation">
          <button type="button" onClick={() => navigate(homeRoute)}>
            <span>D</span>
            Dashboard
          </button>
          <button className="active" type="button" onClick={() => navigate('/map-view')}>
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
            <input type="search" placeholder="Search map layers..." />
            <button type="button" aria-label="Search">Search</button>
          </label>

          <div className="sb-top-actions">
            <span className="map-clock-light">{time.toLocaleTimeString('en-IN', { hour12: true })}</span>
            <div className="sb-user">
              <span>{user?.name || user?.email || 'User'}</span>
              <img src={profileIllustration} alt="" />
            </div>
            <button className="sb-logout" type="button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        <main className="sb-content map-content">
          <div className="sb-page-title">
            <div>
              <h1>Map View</h1>
              <p className="sb-page-subtitle">Switch between 2D map tiles and the interactive 3D city view.</p>
            </div>
            {isAdmin && <button type="button" onClick={() => navigate('/dashboard')}>Admin Dashboard</button>}
          </div>

          <section className="map-layout">
            <aside className="sb-panel map-controls-panel">
              <div className="sb-panel-header">
                <h2>Map Controls</h2>
              </div>
              <div className="map-control-body">
                <p className="map-control-label">View Mode</p>
                <div className="map-segment">
                  <button
                    className={is3D ? '' : 'active'}
                    type="button"
                    onClick={() => {
                      setIs3D(false);
                      setActiveLayer('2D Street');
                    }}
                  >
                    2D
                  </button>
                  <button
                    className={is3D ? 'active' : ''}
                    type="button"
                    onClick={() => {
                      setIs3D(true);
                      setActiveLayer('3D Satellite');
                    }}
                  >
                    3D
                  </button>
                </div>

                <p className="map-control-label">Layer Style</p>
                <div className="map-layer-list">
                  {Object.entries(MAP_LAYERS).map(([name, cfg]) => (
                    <button
                      className={activeLayer === name ? 'active' : ''}
                      key={name}
                      type="button"
                      onClick={() => setActiveLayer(name)}
                    >
                      <span>{cfg.icon}</span>
                      {name}
                    </button>
                  ))}
                </div>

                <p className="map-control-label">Pinned Locations</p>
                <div className="map-empty-light">
                  <strong>No locations yet</strong>
                  <span>Load locations from the backend to see markers on the map.</span>
                </div>
              </div>
            </aside>

            <section className="sb-panel map-panel">
              <div className="sb-panel-header">
                <h2>{is3D ? '3D Satellite View' : '2D Street View'}</h2>
                <span className="map-layer-pill">{activeLayer}</span>
              </div>
              <div className="map-canvas">
                {is3D ? (
                  <Map3D />
                ) : (
                  <MapContainer
                    center={[22.5, 78.9629]}
                    zoom={5}
                    style={{ width: '100%', height: '100%' }}
                    zoomControl={false}
                    key={activeLayer}
                  >
                    <TileLayer url={layer.url} attribution={layer.attribution} maxZoom={18} />
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
              <div className="map-footer-light">
                {LOCATIONS.length} locations pinned | Scroll to zoom | Markers will appear when locations are loaded
              </div>
            </section>
          </section>
        </main>
      </div>
    </div>
  );
}
