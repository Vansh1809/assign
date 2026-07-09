import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const styles = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginTop: 8,
  },
  title: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.08em',
    color: '#94a3b8',
    textTransform: 'uppercase',
    margin: '0 0 10px',
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: '0.12em',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  btn: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 12,
    border: '1px solid rgba(51,65,85,0.55)',
    background: 'rgba(15,23,42,0.35)',
    color: '#94a3b8',
    cursor: 'pointer',
    fontWeight: 800,
    fontSize: 13,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'all 0.15s ease',
  },
  btnActive: {
    background: '#0b1224',
    borderColor: '#6366f1',
    color: '#e2e8f0',
    boxShadow: '0 10px 30px rgba(99,102,241,0.18)',
  },
  icon: {
    width: 24,
    display: 'inline-flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 16,
  },
  small: { fontSize: 11, color: '#64748b', fontWeight: 900 },
};


export default function AdminMenu({ compact = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const isAdmin = (user?.role?.name || user?.role || '').toString() === 'Admin';

  const items = [
    { label: 'Dashboard', to: '/dashboard', icon: '📊' },
    { label: 'Users', to: '/admin/users', icon: '👥' },
    { label: 'Roles', to: '/admin/roles', icon: '🧩' },
    { label: 'Permissions', to: '/admin/role-permissions', icon: '🔐' },
    { label: 'Email Templates', to: '/admin/email', icon: '✉️' },
  ];

  if (!isAdmin) return null;

  return (
    <div
      style={{
        width: compact ? 92 : 320,
      }}
    >
      {!compact && <div style={styles.title}>Admin Navigation</div>}

      <div style={styles.sectionLabel}>
        {compact ? 'NAV' : 'MANAGEMENT'}
      </div>

      <div style={styles.wrap}>
        {items.map((it) => {
          const active = location.pathname === it.to;
          return (
            <button
              key={it.to}
              type="button"
              onClick={() => navigate(it.to)}
              style={{
                ...styles.btn,
                ...(active ? styles.btnActive : {}),
                justifyContent: compact ? 'center' : 'flex-start',
                gap: compact ? 0 : 10,
              }}
              aria-current={active ? 'page' : undefined}
            >
              <span style={styles.icon}>{it.icon}</span>
              {!compact && <span>{it.label}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}


