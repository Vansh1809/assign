import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();

  // ================= STATES =================
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('All');

  // ================= FETCH USERS =================
  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchUsers = async () => {
    try {
      if (!token) return;
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const maybe = await response.json().catch(() => null);
        throw new Error(maybe?.message || `Failed to fetch users: ${response.status}`);
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // ================= DELETE USER =================
  // Backend currently only supports GET /api/admin/users.
  // Keep UI actions but show a clear message.
  const deleteUser = async () => {
    window.alert('Delete is not available yet. Backend only supports listing users.');
  };

  // ================= EDIT USER =================
  const editUser = async () => {
    window.alert('Edit is not available yet. Backend only supports listing users.');
  };

  // ================= FILTER USERS =================
  const filteredUsers = useMemo(() => {
    const search = searchTerm.toLowerCase();

    const wantedRole = filterRole === 'All' ? 'all' : filterRole.toLowerCase();

    return users.filter((user) => {
      const name = (user.name || '').toLowerCase();
      const email = (user.email || '').toLowerCase();

      const matchesSearch = name.includes(search) || email.includes(search);

      const userRole = (user.role || '').toLowerCase();
      const matchesRole =
        wantedRole === 'all' || (userRole ? userRole === wantedRole : false);

      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, filterRole]);

  // ================= AI CHAT =================
  const [chatInput, setChatInput] = useState('');

  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      content: 'Admin assistant ready. Ask about users, roles, or system status.',
    },
  ]);
  const [chatBusy, setChatBusy] = useState(false);

  const canSend = useMemo(() => chatInput.trim().length > 0 && !chatBusy, [
    chatInput,
    chatBusy,
  ]);


  const handleSend = async () => {
    if (!canSend) return;

    const text = chatInput.trim();
    setChatInput('');

    setChatMessages((prev) => [...prev, { role: 'user', content: text }]);
    setChatBusy(true);

    try {
      const lower = text.toLowerCase();
      let reply =
        'I can help with admin actions. Try: "How many users are there?" or "List admin users."';

      if (lower.includes('how many') || lower.includes('count') || lower.includes('users')) {
        reply = `There are ${users.length} user(s) currently in the system. (Fetched from /api/admin/users.)`;
      } else if (lower.includes('list') && lower.includes('admin')) {
        const admins = users.filter((u) => u.role === 'Admin');
        reply = `Admins: ${admins.length}. ${admins
          .map((a) => a.email)
          .slice(0, 8)
          .join(', ')}${admins.length > 8 ? ' ...' : ''}`;
      }

      setChatMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } finally {
      setChatBusy(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // ================= UI =================
  return (
    <div style={styles.pageRoot}>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <div style={styles.headerTitle}>🛡️ Admin</div>
          <div style={styles.headerSubtitle}>Logged in as {user?.email}</div>
        </div>
        <div style={styles.headerActions}>
          <button
            onClick={() => navigate('/dashboard')}
            style={styles.backBtn}
          >
            Back to Dashboard
          </button>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            🚪 Logout
          </button>
        </div>
      </div>

      <div style={styles.grid}>
        {/* USERS */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={styles.cardTitle}>👥 User Management</div>
            <div style={styles.cardSub}>
              Fetch via <code>/api/admin/users</code>
            </div>
          </div>

          <div style={styles.cardBody}>
            {/* Stats */}
            <div style={styles.statsRow}>
              <div style={styles.statCard}>
                <div style={styles.statValue}>{users.length}</div>
                <div style={styles.statLabel}>Total Users</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statValue}>
                  {users.filter((u) => u.role === 'Admin').length}
                </div>
                <div style={styles.statLabel}>Admins</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statValue}>
                  {users.filter((u) => u.role === 'User').length}
                </div>
                <div style={styles.statLabel}>Regular Users</div>
              </div>
            </div>

            {/* CONTROLS */}
            <div style={styles.controls}>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.search}
              />

              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                style={styles.select}
              >
                <option>All</option>
                <option>Admin</option>
                <option>User</option>
                <option>Moderator</option>
              </select>

              <button onClick={fetchUsers} style={styles.refreshBtn}>
                ↻ Refresh
              </button>
            </div>

            {/* ERROR */}
            {error && <div style={styles.error}>{error}</div>}

            {/* USERS TABLE */}
            <div style={{ marginTop: 12, overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Email</th>
                    <th style={thStyle}>Role</th>
                    <th style={thStyle}>Joined</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <tr key={user.id || user._id}>
                        <td style={tdStyle}>
                          <img
                            src={
                              user.profilePicture ||
                              `https://i.pravatar.cc/40?u=${user.email}`
                            }
                            alt={user.name}
                            style={styles.avatar}
                            onError={(e) => {
                              e.currentTarget.src = `https://i.pravatar.cc/40?u=${user.email}`;
                            }}
                          />
                          <span style={{ marginLeft: 10 }}>{user.name}</span>
                        </td>
                        <td style={tdStyle}>{user.email}</td>
                        <td style={tdStyle}>
                          <span style={styles.roleBadge}>
                            {(user.role || 'Unknown').toUpperCase()}
                          </span>
                        </td>
                        <td style={tdStyle}>-</td>
                        <td style={tdStyle}>
                          <div style={styles.actions}>
                            <button
                              className="action-btn view-btn"
                              title="View"
                              style={styles.actionBtn}
                              onClick={() => {
                                window.alert(
                                  `Name: ${user.name}\nEmail: ${user.email}\nRole: ${user.role || 'Unknown'}`
                                );
                              }}
                            >
                              👁️
                            </button>

                            <button
                              className="action-btn edit-btn"
                              title="Edit"
                              style={styles.actionBtn}
                              onClick={() => editUser(user)}
                            >
                              ✏️
                            </button>

                            <button
                              className="action-btn delete-btn"
                              title="Delete"
                              style={styles.actionBtn}
                              onClick={() => deleteUser(user.id)}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} style={tdStyle}>
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={styles.hint}>
              Note: backend currently exposes only <code>GET /api/admin/users</code>.
              Edit/Delete actions show a placeholder message.
            </div>
          </div>
        </div>

        {/* AI Chat */}
        <div style={styles.chatCard}>
          <div style={styles.chatHeader}>
            <div style={styles.chatTitle}>🤖 AI Chat Panel</div>
            <div style={styles.chatSub}>Frontend panel (placeholder logic)</div>
          </div>

          <div style={styles.chatBody}>
            {chatMessages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                  marginBottom: 10,
                }}
              >
                <div style={styles.bubble}>
                  {m.content}
                </div>
              </div>
            ))}

            {chatBusy && <div style={styles.thinking}>Thinking...</div>}
          </div>

          <div style={styles.chatFooter}>
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask the admin assistant..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              style={styles.chatInput}
            />
            <button
              onClick={handleSend}
              disabled={!canSend}
              style={{
                ...styles.chatSendBtn,
                background: canSend ? '#6366f1' : '#334155',
                cursor: canSend ? 'pointer' : 'not-allowed',
              }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const thStyle = {
  textAlign: 'left',
  fontSize: 12,
  padding: '10px 8px',
  color: '#94a3b8',
  borderBottom: '1px solid #334155',
  whiteSpace: 'nowrap',
};

const tdStyle = {
  fontSize: 13,
  padding: '10px 8px',
  borderBottom: '1px solid rgba(51,65,85,0.6)',
  color: '#e2e8f0',
  whiteSpace: 'nowrap',
};

const styles = {
  pageRoot: {
    minHeight: '100vh',
    background: '#0f172a',
    color: '#e2e8f0',
    padding: 16,
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  loadingBox: {
    border: '1px solid #334155',
    borderRadius: 12,
    background: '#1e293b',
    padding: 18,
    width: 'fit-content',
    margin: '20px auto',
    color: '#94a3b8',
    fontWeight: 700,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '10px 14px',
    border: '1px solid #334155',
    borderRadius: 12,
    background: '#1e293b',
    marginBottom: 14,
  },
  headerTitle: { fontWeight: 800, fontSize: 16 },
  headerSubtitle: { color: '#94a3b8', fontSize: 12 },
  headerActions: { display: 'flex', gap: 10, alignItems: 'center' },
  backBtn: {
    background: '#0f172a',
    border: '1px solid #334155',
    color: '#e2e8f0',
    padding: '8px 12px',
    borderRadius: 10,
    cursor: 'pointer',
    fontWeight: 700,
  },
  logoutBtn: {
    background: '#ff6b6b',
    border: 'none',
    color: '#111827',
    padding: '8px 12px',
    borderRadius: 10,
    cursor: 'pointer',
    fontWeight: 800,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1.05fr 0.95fr',
    gap: 14,
    alignItems: 'start',
  },
  card: {
    border: '1px solid #334155',
    borderRadius: 12,
    background: '#1e293b',
    overflow: 'hidden',
  },
  cardHeader: { padding: 14, borderBottom: '1px solid #334155' },
  cardTitle: { fontWeight: 900 },
  cardSub: { color: '#94a3b8', fontSize: 12 },
  cardBody: { padding: 14 },
  statsRow: { display: 'flex', gap: 12, marginBottom: 14 },
  statCard: {
    flex: 1,
    border: '1px solid rgba(51,65,85,0.6)',
    background: '#0f172a',
    borderRadius: 12,
    padding: '12px 14px',
  },
  statValue: { fontSize: 20, fontWeight: 900, marginBottom: 4 },
  statLabel: { color: '#94a3b8', fontSize: 12, fontWeight: 700 },
  controls: { display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 },
  search: {
    flex: 1,
    padding: '10px 12px',
    borderRadius: 12,
    border: '1px solid #334155',
    background: '#0f172a',
    color: '#e2e8f0',
    outline: 'none',
  },
  select: {
    padding: '10px 10px',
    borderRadius: 12,
    border: '1px solid #334155',
    background: '#0f172a',
    color: '#e2e8f0',
    outline: 'none',
    fontWeight: 700,
  },
  refreshBtn: {
    background: '#0f172a',
    border: '1px solid #334155',
    color: '#e2e8f0',
    padding: '10px 12px',
    borderRadius: 12,
    cursor: 'pointer',
    fontWeight: 900,
  },
  error: {
    color: '#fb7185',
    fontWeight: 800,
    marginBottom: 10,
    padding: '8px 10px',
    borderRadius: 10,
    border: '1px solid rgba(251,113,133,0.4)',
    background: 'rgba(251,113,133,0.08)',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  avatar: { width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' },
  roleBadge: {
    display: 'inline-flex',
    padding: '2px 10px',
    borderRadius: 999,
    background: '#0f172a',
    border: '1px solid #334155',
    fontWeight: 900,
    fontSize: 11,
  },
  actions: { display: 'flex', gap: 8, alignItems: 'center' },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    background: '#0f172a',
    border: '1px solid #334155',
    color: '#e2e8f0',
    cursor: 'pointer',
    fontWeight: 900,
  },
  hint: {
    marginTop: 12,
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 1.45,
  },
  chatCard: {
    border: '1px solid #334155',
    borderRadius: 12,
    background: '#1e293b',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 520,
  },
  chatHeader: { padding: 14, borderBottom: '1px solid #334155' },
  chatTitle: { fontWeight: 900 },
  chatSub: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  chatBody: { padding: 14, flex: 1, overflowY: 'auto' },
  bubble: {
    maxWidth: '85%',
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: 14,
    padding: '10px 12px',
    color: '#e2e8f0',
    fontSize: 13,
    lineHeight: 1.45,
    whiteSpace: 'pre-wrap',
  },
  thinking: { color: '#94a3b8', fontSize: 12 },
  chatFooter: {
    padding: 14,
    borderTop: '1px solid #334155',
    display: 'flex',
    gap: 10,
    alignItems: 'center',
  },
  chatInput: {
    flex: 1,
    padding: '12px 14px',
    borderRadius: 12,
    border: '1px solid #334155',
    background: '#0f172a',
    color: '#e2e8f0',
    outline: 'none',
  },
  chatSendBtn: {
    border: 'none',
    color: '#fff',
    padding: '12px 16px',
    borderRadius: 12,
    cursor: 'pointer',
    fontWeight: 900,
  },
};


