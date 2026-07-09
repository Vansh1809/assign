import React, { useMemo, useState } from 'react';
import AdminLayout from '../Components/AdminLayout';
import { AdminPageLayout, Card, PageHeader } from '../Components/ui';
import './AdminUsersPage.css';

const ROLE_PILL = {
  Admin: { label: 'Admin', className: 'um-pill um-pill--admin' },
  Editor: { label: 'Editor', className: 'um-pill um-pill--editor' },
  Viewer: { label: 'Viewer', className: 'um-pill um-pill--viewer' },
};

const STATUS_PILL = {
  Active: { label: 'Active', className: 'um-pill um-pill--active' },
  Inactive: { label: 'Inactive', className: 'um-pill um-pill--inactive' },
};

const KPI = {
  totalUsers: 45,
  activeUsers: 38,
  newThisMonth: 12,
  lockedUsers: 2,
};

function formatDate(isoLike) {
  const d = new Date(isoLike);
  if (Number.isNaN(d.getTime())) return isoLike;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
}

function initials(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  const a = parts[0]?.[0] || '';
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : '';
  return (a + b).toUpperCase();
}

function makeDummyUsers() {
  const roles = ['Admin', 'Editor', 'Viewer'];

  // Exact totals per spec:
  // - Total Users: 45
  // - Active Users: 38
  // - Locked Users: 2 (rendered as locked note in Actions)
  // - New This Month: 12 (createdAt in last ~30 days)
  const statuses = [...Array.from({ length: 38 }, () => 'Active'), ...Array.from({ length: 7 }, () => 'Inactive')];

  const now = new Date('2026-07-01T12:00:00Z');

  const users = [];
  for (let i = 0; i < 45; i++) {
    const role = roles[i % roles.length];
    const status = statuses[i];

    const isNewThisMonth = i < 12;
    const createdAt = new Date(
      now.getTime() - (isNewThisMonth ? i * 1.8 : 40 + i * 3.2) * 24 * 60 * 60 * 1000
    ).toISOString();

    users.push({
      id: `u_${i + 1}`,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      role,
      status,
      createdAt,
      locked: i === 41 || i === 44,
    });
  }

  return users;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState(() => makeDummyUsers());

  // Filter (spec: All Status)
  const [filterStatus, setFilterStatus] = useState('All Status');

  // Sorting
  const [sortBy, setSortBy] = useState('id'); // #
  const [sortDir, setSortDir] = useState('asc');

  // Pagination (spec: 1..9 pages, 5 rows per page)
  const pageSize = 5;
  const [page, setPage] = useState(1);

  const filteredSorted = useMemo(() => {
    let list = [...users];

    if (filterStatus !== 'All Status') {
      const wanted = filterStatus === 'Active' ? 'Active' : 'Inactive';
      list = list.filter((u) => u.status === wanted);
    }

    const dir = sortDir === 'asc' ? 1 : -1;
    const cmp = (a, b) => {
      if (a === b) return 0;
      return a > b ? dir : -dir;
    };

    list.sort((a, b) => {
      if (sortBy === 'id') return cmp(parseInt(a.id.split('_')[1], 10), parseInt(b.id.split('_')[1], 10));
      if (sortBy === 'name') return cmp((a.name || '').toLowerCase(), (b.name || '').toLowerCase());
      if (sortBy === 'email') return cmp((a.email || '').toLowerCase(), (b.email || '').toLowerCase());
      if (sortBy === 'role') return cmp((a.role || '').toLowerCase(), (b.role || '').toLowerCase());
      if (sortBy === 'status') return cmp((a.status || '').toLowerCase(), (b.status || '').toLowerCase());
      if (sortBy === 'createdAt') return cmp(new Date(a.createdAt).getTime(), new Date(b.createdAt).getTime());
      return 0;
    });

    return list;
  }, [users, filterStatus, sortBy, sortDir]);

  const totalFiltered = filteredSorted.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));

  const safePage = clamp(page, 1, totalPages);

  const paged = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredSorted.slice(start, start + pageSize);
  }, [filteredSorted, safePage]);

  const showingStart = totalFiltered === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const showingEnd = totalFiltered === 0 ? 0 : Math.min(safePage * pageSize, totalFiltered);

  const handleSort = (key) => {
    if (sortBy === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(key);
      setSortDir('asc');
    }
    setPage(1);
  };

  const handleRefresh = () => {
    setUsers(makeDummyUsers());
    setFilterStatus('All Status');
    setSortBy('id');
    setSortDir('asc');
    setPage(1);
  };

  const deleteUser = (row) => window.alert(`Delete (placeholder)\n\n${row.name} - ${row.email}`);
  const editUser = (row) => window.alert(`Edit (placeholder)\n\n${row.name} - ${row.email}`);
  const viewUser = (row) => window.alert(`View (placeholder)\n\n${row.name} - ${row.email}`);

  // Pagination UI: prev/1/2/3/.../9/next (spec)
  const pageNumbers = [1, 2, 3];
  const showEllipsis = totalPages > 4;
  const last = Math.min(9, totalPages);

  return (
    <AdminLayout>
      <AdminPageLayout>
        <div className="um-page">
          <PageHeader
            title="User Management"
            subtitle="Manage users, roles, and account access."
            onRefresh={handleRefresh}
          />

          {/* Stats cards row */}
          <div className="um-stats-grid">
            <div className="um-kpi um-kpi--blue">
              <div className="um-kpi-icon" aria-hidden="true">👥</div>
              <div className="um-kpi-body">
                <div className="um-kpi-value">{KPI.totalUsers}</div>
                <div className="um-kpi-label">Total Users</div>
                <div className="um-kpi-sub">All registered accounts</div>
              </div>
            </div>

            <div className="um-kpi um-kpi--green">
              <div className="um-kpi-icon" aria-hidden="true">🛡️</div>
              <div className="um-kpi-body">
                <div className="um-kpi-value">{KPI.activeUsers}</div>
                <div className="um-kpi-label">Active Users</div>
                <div className="um-kpi-sub">Verified and enabled</div>
              </div>
            </div>

            <div className="um-kpi um-kpi--orange">
              <div className="um-kpi-icon" aria-hidden="true">➕</div>
              <div className="um-kpi-body">
                <div className="um-kpi-value">{KPI.newThisMonth}</div>
                <div className="um-kpi-label">New This Month</div>
                <div className="um-kpi-sub">Joined in the last 30 days</div>
              </div>
            </div>

            <div className="um-kpi um-kpi--purple">
              <div className="um-kpi-icon" aria-hidden="true">🔒</div>
              <div className="um-kpi-body">
                <div className="um-kpi-value">{KPI.lockedUsers}</div>
                <div className="um-kpi-label">Locked Users</div>
                <div className="um-kpi-sub">Access temporarily restricted</div>
              </div>
            </div>
          </div>

          {/* Users List */}
          <Card className="um-card">
            <div className="um-card-head">
              <div className="um-card-title">Users List</div>

              <div className="um-card-actions">
                <select
                  className="um-select"
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setPage(1);
                  }}
                  aria-label="All Status"
                >
                  <option>All Status</option>
                  <option>Active</option>
                  <option>Inactive</option>
                </select>

                <button className="um-add-btn" type="button" onClick={() => window.alert('Add User (placeholder)')}>
                  + Add User
                </button>
              </div>
            </div>

            <div className="um-table-wrap">
              <table className="um-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('id')} role="button" tabIndex={0}>
                      #
                      {sortBy === 'id' && <span className="um-sort">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                    </th>
                    <th onClick={() => handleSort('name')} role="button" tabIndex={0}>
                      Name
                      {sortBy === 'name' && <span className="um-sort">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                    </th>
                    <th onClick={() => handleSort('email')} role="button" tabIndex={0}>
                      Email
                      {sortBy === 'email' && <span className="um-sort">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                    </th>
                    <th onClick={() => handleSort('role')} role="button" tabIndex={0}>
                      Role
                      {sortBy === 'role' && <span className="um-sort">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                    </th>
                    <th onClick={() => handleSort('status')} role="button" tabIndex={0}>
                      Status
                      {sortBy === 'status' && <span className="um-sort">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                    </th>
                    <th onClick={() => handleSort('createdAt')} role="button" tabIndex={0}>
                      Created At
                      {sortBy === 'createdAt' && <span className="um-sort">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {paged.map((u, i) => {
                    const rowIndex = showingStart + i;
                    const rolePill = ROLE_PILL[u.role] || ROLE_PILL.Viewer;
                    const statusPill = STATUS_PILL[u.status] || STATUS_PILL.Inactive;

                    return (
                      <tr key={u.id}>
                        <td className="um-td">{rowIndex}</td>
                        <td className="um-td">
                          <div className="um-name-cell">
                            <div className="um-avatar" aria-hidden="true">{initials(u.name)}</div>
                            <div className="um-name-info">
                              <div className="um-name">{u.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="um-td um-hide-sm">{u.email}</td>
                        <td className="um-td">
                          <span className={rolePill.className}>{rolePill.label}</span>
                        </td>
                        <td className="um-td">
                          <span className={statusPill.className}>{statusPill.label}</span>
                        </td>
                        <td className="um-td um-hide-sm">{formatDate(u.createdAt)}</td>
                        <td className="um-td">
                          <div className="um-actions">
                            <button className="um-icon-btn um-icon-btn--info" type="button" onClick={() => viewUser(u)} aria-label="View">
                              👁️
                            </button>
                            <button className="um-icon-btn" type="button" onClick={() => editUser(u)} aria-label="Edit">
                              ✏️
                            </button>
                            <button className="um-icon-btn um-icon-btn--danger" type="button" onClick={() => deleteUser(u)} aria-label="Delete">
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {paged.length === 0 && (
                    <tr>
                      <td className="um-empty" colSpan={7}>No users found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="um-card-footer">
              <div className="um-foot-meta">Showing {showingStart} to {showingEnd} of {totalFiltered} entries</div>

              <div className="um-pagination" aria-label="Pagination">
                <button className="um-page-btn" disabled={safePage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  ← Prev
                </button>

                {pageNumbers.map((n) => (
                  <button
                    key={n}
                    className={`um-page-btn ${safePage === n ? 'is-active' : ''}`}
                    disabled={n > totalPages}
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </button>
                ))}

                {showEllipsis && <span className="um-ellipsis" aria-hidden="true">…</span>}

                <button
                  className={`um-page-btn ${safePage === last ? 'is-active' : ''}`}
                  disabled={last < 1 || last > totalPages}
                  onClick={() => setPage(last)}
                >
                  {last}
                </button>

                <button className="um-page-btn" disabled={safePage === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                  Next →
                </button>
              </div>
            </div>
          </Card>
        </div>
      </AdminPageLayout>
    </AdminLayout>
  );
}

