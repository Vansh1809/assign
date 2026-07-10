  import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../Components/AdminLayout';
import { AdminPageLayout, Card, PageHeader, Modal, Button } from '../Components/ui';
import './AdminUsersPage.css';
import { useAuth } from '../AuthContext';


// Keep API base consistent with other admin pages.
// If env already ends with `/api`, don’t double-append.
const API_BASE_RAW = process.env.REACT_APP_API_BASE_URL;
const API_BASE = (() => {
  const fallback = 'http://localhost:5000/api';
  const raw = (API_BASE_RAW && String(API_BASE_RAW).trim()) || fallback;
  const trimmed = raw.replace(/\/+$/, '');
  return trimmed.toLowerCase().endsWith('/api') ? trimmed : `${trimmed}/api`;
})();


const ROLE_PILL = {
  Admin: { label: 'Admin', className: 'um-pill um-pill--admin' },
  Editor: { label: 'Editor', className: 'um-pill um-pill--editor' },
  Viewer: { label: 'Viewer', className: 'um-pill um-pill--viewer' },
  Manager: { label: 'Manager', className: 'um-pill um-pill--admin' },
  User: { label: 'User', className: 'um-pill um-pill--viewer' },
  Moderator: { label: 'Moderator', className: 'um-pill um-pill--editor' },
  Vendor: { label: 'Vendor', className: 'um-pill um-pill--viewer' },
};

const STATUS_PILL = {
  Active: { label: 'Active', className: 'um-pill um-pill--active' },
  Inactive: { label: 'Inactive', className: 'um-pill um-pill--inactive' },
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

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function getUserId(u) {
  return u?.id || u?._id;
}

function normalizeStatus(s) {
  return s === 'Inactive' ? 'Inactive' : 'Active';
}

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function ToastStack({ toasts }) {
  return (
    <div className="rm-toastStack" aria-live="polite" aria-relevant="additions removals">
      {toasts.map((t) => (
        <div key={t.id} className={`rm-toast rm-toast--${t.type}`}>
          <div className="rm-toastMsg">{t.message}</div>
        </div>
      ))}
    </div>
  );
}

export default function AdminUsersPage() {
  const { token } = useAuth();

  const [users, setUsers] = useState([]);
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [sortBy, setSortBy] = useState('id');
  const [sortDir, setSortDir] = useState('asc');

  const pageSize = 5;
  const [page, setPage] = useState(1);

  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState('');

  // Required state management
  const [selectedUser, setSelectedUser] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [loading, setLoading] = useState(false); // view loading
  const [saving, setSaving] = useState(false); // edit saving
  const [deleting, setDeleting] = useState(false); // delete deleting

  // Edit form
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState('');
  const [formStatus, setFormStatus] = useState('Active');
  const [formProfilePictureFileName, setFormProfilePictureFileName] = useState('');

  const [formErrors, setFormErrors] = useState({});

  const [rolesCatalog, setRolesCatalog] = useState([]);

  // Toasts
  const [toasts, setToasts] = useState([]);
  const addToast = (type, message) => {
    const t = { id: uid(), type, message };
    setToasts((prev) => [...prev, t]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), 3200);
  };

  // --- Modal-local error state ---
  // Root cause (BUG 2): AdminUsersPage was closing modals on a fetch failure.
  // When clicking an action, open state flips true, then the fetch hits a 404
  // and the catch immediately calls setIs*ModalOpen(false), causing the flash.
  // We keep the modal open and show the error inside it instead.
  const [viewError, setViewError] = useState('');
  const [editError, setEditError] = useState('');
  const [deleteError, setDeleteError] = useState('');


  const fetchRolesCatalog = async () => {
    // Best-effort: roles are not directly required by backend for CRUD; we still populate dropdown.
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/roles/public`, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => null);
      if (!res || !res.ok) return;
      const data = await res.json().catch(() => ({}));
      setRolesCatalog(Array.isArray(data.roles) ? data.roles : []);

    } catch {
      // ignore
    }
  };

  const fetchUsers = async () => {
    if (!token) {
      setUsers([]);
      setUsersError('Please login as admin to manage users.');
      setLoadingUsers(false);
      return;
    }

    setLoadingUsers(true);
    setUsersError('');

    try {
      const res = await fetch(`${API_BASE}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || `Failed to fetch users (${res.status})`);
      // New protocol: { status, operation, data: { users } }
      setUsers(Array.isArray(data?.data?.users) ? data.data.users : (Array.isArray(data.users) ? data.users : []));

    } catch (e) {
      setUsers([]);
      setUsersError(e?.message || 'Failed to fetch users');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRolesCatalog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const computedKpis = useMemo(() => {
    const list = Array.isArray(users) ? users : [];
    const total = list.length;

    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    const activeUsers = list.filter((u) => normalizeStatus(u?.status) === 'Active').length;

    // Best-effort locked count based on status field.
    // Current UI only distinguishes Active/Inactive; treat non-Active as locked.
    // If backend starts returning 'Locked' we’ll count it too.
    const lockedUsers = list.filter((u) => {
      const s = (u?.status || '').toString().trim();
      return s === 'Locked' || normalizeStatus(s) === 'Inactive';
    }).length;

    const newThisMonth = list.filter((u) => {
      const t = u?.createdAt ? new Date(u.createdAt).getTime() : NaN;
      return !Number.isNaN(t) && t >= thirtyDaysAgo;
    }).length;

    return {
      totalUsers: total,
      activeUsers,
      lockedUsers,
      newThisMonth,
    };
  }, [users]);

  const filteredSorted = useMemo(() => {
    let list = [...users];


    if (filterStatus !== 'All Status') {
      const wanted = filterStatus === 'Active' ? 'Active' : 'Inactive';
      list = list.filter((u) => normalizeStatus(u.status) === wanted);
    }

    // Ensure stable shape for sort comparisons
    list = list.map((u) => ({
      ...u,
      id: u?.id || u?._id,
    }));


    const dir = sortDir === 'asc' ? 1 : -1;
    const cmp = (a, b) => {
      if (a === b) return 0;
      return a > b ? dir : -dir;
    };

    list.sort((a, b) => {
      const aId = String(getUserId(a));
      const bId = String(getUserId(b));
      if (sortBy === 'id') return cmp(aId, bId);
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

  useEffect(() => {
    setPage(1);
  }, [filterStatus]);

  const handleSort = (key) => {
    if (sortBy === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(key);
      setSortDir('asc');
    }
    setPage(1);
  };

  const handleRefresh = async () => {
    await fetchUsers();
    setFilterStatus('All Status');
    setSortBy('id');
    setSortDir('asc');
    setPage(1);
  };

  const openView = (row) => {
    // BUG FIX: View/Edit were doing an extra GET `${API_BASE}/api/users/:id`.
    // That extra fetch was failing with 404, so all actions looked broken.
    // The table rows already contain name/email/role/status/createdAt, so we
    // can render directly from `row` and remove the fragile re-fetch.

    setSelectedUser(row);
    setViewError('');
    setIsViewModalOpen(true);
    setLoading(false);
  };


  const openEdit = (row) => {
    // BUG FIX: remove extra GET-by-id fetch (was causing 404 for all rows).
    // Use the already-loaded row object to prefill the edit form.

    setSelectedUser(row);
    setEditError('');
    setIsEditModalOpen(true);
    setFormErrors({});

    setLoading(false);

    // Prefill the form from row
    setFormName(row?.name || '');
    setFormEmail(row?.email || '');
    setFormPhone(row?.phone || '');
    setFormRole(row?.role || '');
    setFormStatus(row?.status ? normalizeStatus(row.status) : 'Active');
    setFormProfilePictureFileName('');

    // Keep any existing optimistic ETag if present on the row (usually not on list)
    // so PUT can work with If-Match when backend requires it.
    // If it's missing, backend should respond with 409 and the user will refresh.
    setSelectedUser((prev) => (prev ? { ...prev } : prev));
  };


  const validateEdit = () => {
    const errors = {};

    const name = formName.trim();
    const email = formEmail.trim();
    const phone = formPhone.trim();

    if (!name) errors.name = 'Name is required';
    if (!email) errors.email = 'Email is required';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Invalid email';
    if (!phone) errors.phone = 'Phone is required';
    if (phone && phone.replace(/\D/g, '').length < 8) errors.phone = 'Invalid phone';

    if (!formRole.trim()) errors.role = 'Role is required';

    if (formStatus !== 'Active' && formStatus !== 'Inactive') errors.status = 'Status is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const submitEdit = async () => {
    if (!token) return;
    if (!selectedUser) return;

    const ok = validateEdit();
    if (!ok) return;

    const id = getUserId(selectedUser);

    setSaving(true);
    try {
      // Use ETag from the selectedUser if present, else omit (backend will 409)
      const etag = selectedUser?.etag;

      const res = await fetch(`${API_BASE}/users/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...(etag != null ? { 'If-Match': String(etag) } : {}),
        },
        body: JSON.stringify({
          name: formName.trim(),
          email: formEmail.trim(),
          phone: formPhone.trim(),
          role: formRole.trim(),
          status: formStatus,
          profilePicture: formProfilePictureFileName ? formProfilePictureFileName : undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // New protocol validation errors
        if (data?.status === 'VALIDATION_ERROR' && data?.errors) {
          const errs = data.errors || {};
          setFormErrors({
            name: errs.name,
            email: errs.email,
            phone: errs.phone,
            role: errs.role,
            status: errs.status,
          });
          return;
        }
        throw new Error(data?.message || `Failed to update user (${res.status})`);
      }

      addToast('success', 'User updated successfully');

      setIsEditModalOpen(false);
      setSelectedUser(null);
      await fetchUsers();
    } catch (e) {
      addToast('error', e?.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }

  };

  const openDelete = (row) => {
    // Root cause (BUG 2): keep modal state driven only by explicit open/close.
    // No async fetch happens on delete-open, so flashing-close usually comes from
    // other modals sharing the same `loading` state; we ensure delete has its own error.
    setSelectedUser(row);
    setDeleteError('');
    setIsDeleteModalOpen(true);
  };


  const confirmDelete = async () => {
    if (!selectedUser) return;
    const id = getUserId(selectedUser);
    if (!id) return;

    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || `Failed to delete user (${res.status})`);

      addToast('success', 'User deleted successfully');
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
      setDeleteError('');
      // Remove from table without reload
      setUsers((prev) => prev.filter((u) => String(getUserId(u)) !== String(id)));
    } catch (e) {
      const msg = e?.message || 'Failed to delete user';
      setDeleteError(msg);
      addToast('error', msg);
      // Keep modal open so user sees failure.
    } finally {
      setDeleting(false);
    }
  };


  const viewModal = (
    <Modal
      open={isViewModalOpen}
      title="View User"
      onClose={() => {
        setIsViewModalOpen(false);
        setSelectedUser(null);
        setViewError('');
      }}
      description="Complete user information"
      footer={
        <Button variant="secondary" onClick={() => setIsViewModalOpen(false)} disabled={loading}>
          Close
        </Button>
      }
    >
      {loading ? (
        <div className="um-modal-loading">Loading…</div>
      ) : viewError ? (
        <div className="um-empty um-usersError" role="alert" aria-live="polite">
          <div className="um-usersErrorTitle">Failed to load user</div>
          <div className="um-usersErrorMsg">{viewError}</div>
        </div>
      ) : selectedUser ? (
        <div className="um-viewGrid">

          <div className="um-viewHeader">
            {selectedUser.profilePicture ? (
              <img className="um-viewAvatar" src={selectedUser.profilePicture} alt="" />
            ) : (
              <div className="um-viewAvatar um-viewAvatar--placeholder">{initials(selectedUser.name)}</div>
            )}
            <div>
              <div className="um-viewName">{selectedUser.name}</div>
              <div className="um-viewSub">{selectedUser.email}</div>
            </div>
          </div>

          <div className="um-viewField"><span>Full Name</span><b>{selectedUser.name}</b></div>
          <div className="um-viewField"><span>Email</span><b>{selectedUser.email}</b></div>
          <div className="um-viewField"><span>Phone</span><b>{selectedUser.phone || '—'}</b></div>
          <div className="um-viewField"><span>Role</span><b>{selectedUser.role || '—'}</b></div>
          <div className="um-viewField"><span>Status</span><b>{selectedUser.status || 'Active'}</b></div>
          <div className="um-viewField"><span>Created Date</span><b>{formatDate(selectedUser.createdAt)}</b></div>
          <div className="um-viewField"><span>Last Updated</span><b>{formatDate(selectedUser.lastUpdated)}</b></div>
        </div>
      ) : (
        <div className="um-empty">No user selected.</div>
      )}
    </Modal>
  );

  const editModal = (
    <Modal
      open={isEditModalOpen}
      title="Edit User"
      description="Update user details"
      onClose={() => {
        setIsEditModalOpen(false);
        setSelectedUser(null);
        setFormErrors({});
        setEditError('');
      }}
      footer={
        <>
          <Button variant="secondary" onClick={() => setIsEditModalOpen(false)} disabled={saving || loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submitEdit} disabled={saving || loading}>
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </>
      }
      size="lg"
    >
      {loading ? (
        <div className="um-modal-loading">Loading…</div>
      ) : editError ? (
        <div className="um-empty um-usersError" role="alert" aria-live="polite">
          <div className="um-usersErrorTitle">Failed to load user</div>
          <div className="um-usersErrorMsg">{editError}</div>
        </div>
      ) : (
        <div className="um-editForm">

          <div className="um-formRow">
            <label className="um-formLabel">Full Name</label>
            <input className={`um-formInput ${formErrors.name ? 'um-formInput--error' : ''}`} value={formName} onChange={(e) => setFormName(e.target.value)} />
            {formErrors.name ? <div className="um-formError">{formErrors.name}</div> : null}
          </div>

          <div className="um-formRow">
            <label className="um-formLabel">Email</label>
            <input className={`um-formInput ${formErrors.email ? 'um-formInput--error' : ''}`} value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
            {formErrors.email ? <div className="um-formError">{formErrors.email}</div> : null}
          </div>

          <div className="um-formRow">
            <label className="um-formLabel">Phone</label>
            <input className={`um-formInput ${formErrors.phone ? 'um-formInput--error' : ''}`} value={formPhone} onChange={(e) => setFormPhone(e.target.value)} />
            {formErrors.phone ? <div className="um-formError">{formErrors.phone}</div> : null}
          </div>

          <div className="um-formRow">
            <label className="um-formLabel">Role</label>
            <select className={`um-formInput ${formErrors.role ? 'um-formInput--error' : ''}`} value={formRole} onChange={(e) => setFormRole(e.target.value)}>
              {(rolesCatalog || []).length
                ? rolesCatalog.map((r) => (
                    <option key={r.id || r._id || r.name} value={r.name}>{r.name}</option>
                  ))
                : ['Admin', 'Editor', 'Viewer', 'User', 'Manager', 'Moderator', 'Vendor'].map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
            </select>
            {formErrors.role ? <div className="um-formError">{formErrors.role}</div> : null}
          </div>

          <div className="um-formRow">
            <label className="um-formLabel">Status</label>
            <select className={`um-formInput ${formErrors.status ? 'um-formInput--error' : ''}`} value={formStatus} onChange={(e) => setFormStatus(e.target.value)}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            {formErrors.status ? <div className="um-formError">{formErrors.status}</div> : null}
          </div>

          <div className="um-formRow">
            <label className="um-formLabel">Profile Image (optional)</label>
            <input
              type="file"
              className="um-formInput"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return setFormProfilePictureFileName('');
                // Backend update expects filename; project currently uploads via multipart in signup only.
                // Best-effort: store local filename and keep existing backend behavior if it supports it.
                // In production, wire this to an upload endpoint.
                setFormProfilePictureFileName(file.name);
              }}
            />
            <div className="um-formHelp">Image upload wiring may require a dedicated upload endpoint.</div>
          </div>
        </div>
      )}
    </Modal>
  );

  const deleteModal = (
    <Modal
      open={isDeleteModalOpen}
      title="Delete User"
      description="Are you sure you want to delete this user?"
      onClose={() => {
        setIsDeleteModalOpen(false);
        setSelectedUser(null);
        setDeleteError('');
      }}
      footer={
        <>
          <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </>
      }
      size="sm"
    >
      <div className="um-deleteSummary">
        {deleteError ? (
          <div className="um-empty um-usersError" role="alert" aria-live="polite">
            <div className="um-usersErrorTitle">Failed to delete user</div>
            <div className="um-usersErrorMsg">{deleteError}</div>
          </div>
        ) : null}

        {selectedUser ? (
          <>
            <div className="um-dangerText">You are about to delete <b>{selectedUser.name}</b>.</div>
            <div className="um-subtitle">This action cannot be undone.</div>
          </>
        ) : (
          <div className="um-empty">No user selected.</div>
        )}
      </div>
    </Modal>
  );


  return (
    <AdminLayout>
      <AdminPageLayout>
        <div className="um-page">
          <ToastStack toasts={toasts} />
          <PageHeader
            title="User Management"
            subtitle="Manage users, roles, and account access."
            onRefresh={handleRefresh}
            loading={loadingUsers}
          />

          {loadingUsers ? (
            <div className="um-stats-grid" aria-label="Loading user stats">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="um-kpi" style={{ overflow: 'hidden' }}>
                  <div style={{ flex: 1 }}>
                    <div className="ad-table__skeleton" style={{ height: 40, borderRadius: 12 }} />
                    <div className="um-kpi-label" style={{ marginTop: 10 }}>
                      Loading...
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="um-stats-grid" aria-label="User stats">
              <div className="um-kpi um-kpi--blue">
                <div className="um-kpi-icon" aria-hidden="true">👥</div>
                <div className="um-kpi-body">
                  <div className="um-kpi-value">{computedKpis.totalUsers}</div>
                  <div className="um-kpi-label">Total Users</div>
                  <div className="um-kpi-sub">All registered accounts</div>
                </div>
              </div>

              <div className="um-kpi um-kpi--green">
                <div className="um-kpi-icon" aria-hidden="true">🛡️</div>
                <div className="um-kpi-body">
                  <div className="um-kpi-value">{computedKpis.activeUsers}</div>
                  <div className="um-kpi-label">Active Users</div>
                  <div className="um-kpi-sub">Verified and enabled</div>
                </div>
              </div>

              <div className="um-kpi um-kpi--orange">
                <div className="um-kpi-icon" aria-hidden="true">➕</div>
                <div className="um-kpi-body">
                  <div className="um-kpi-value">{computedKpis.newThisMonth}</div>
                  <div className="um-kpi-label">New This Month</div>
                  <div className="um-kpi-sub">Joined in the last 30 days</div>
                </div>
              </div>

              <div className="um-kpi um-kpi--purple">
                <div className="um-kpi-icon" aria-hidden="true">🔒</div>
                <div className="um-kpi-body">
                  <div className="um-kpi-value">{computedKpis.lockedUsers}</div>
                  <div className="um-kpi-label">Locked Users</div>
                  <div className="um-kpi-sub">Access temporarily restricted</div>
                </div>
              </div>
            </div>
          )}

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

                <button className="um-add-btn" type="button" onClick={() => addToast('error', 'Add User not implemented in this task')}>
                  + Add User
                </button>
              </div>
            </div>

            {usersError ? (
              <div
                className="um-empty um-usersError"
                role="alert"
                aria-live="polite"
              >
                <div className="um-usersErrorTitle">Failed to load users</div>
                <div className="um-usersErrorMsg">{usersError}</div>
                <div className="um-usersErrorCta">
                  <button
                    type="button"
                    className="um-add-btn"
                    onClick={fetchUsers}
                    disabled={loadingUsers}
                  >
                    {loadingUsers ? 'Retrying…' : 'Retry'}
                  </button>
                </div>
              </div>
            ) : null}


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
                  {loadingUsers ? (
                    Array.from({ length: pageSize }).map((_, idx) => (
                      <tr key={`sk-${idx}`}>
                        {Array.from({ length: 7 }).map((__, cidx) => (
                          <td key={cidx} className="um-td">
                            <div className="ad-table__skeleton" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : paged.length ? (
                    paged.map((u, i) => {
                      const rowIndex = showingStart + i;
                      const rolePill = ROLE_PILL[u.role] || ROLE_PILL.Viewer;
                      const statusPill = STATUS_PILL[normalizeStatus(u.status)] || STATUS_PILL.Active;

                      return (
                        <tr key={getUserId(u)}>
                          <td className="um-td">{rowIndex}</td>
                          <td className="um-td">
                            <div className="um-name-cell">
                              {u.profilePicture ? (
                                <img className="um-avatar" src={u.profilePicture} alt="" />
                              ) : (
                                <div className="um-avatar" aria-hidden="true">{initials(u.name)}</div>
                              )}
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
                              <button
                                className="um-icon-btn um-icon-btn--info"
                                type="button"
                                onClick={() => openView(u)}
                                aria-label="View"
                                disabled={loading || saving || deleting}
                              >
                                👁️
                              </button>
                              <button
                                className="um-icon-btn"
                                type="button"
                                onClick={() => openEdit(u)}
                                aria-label="Edit"
                                disabled={loading || saving || deleting}
                              >
                                ✏️
                              </button>
                              <button
                                className="um-icon-btn um-icon-btn--danger"
                                type="button"
                                onClick={() => openDelete(u)}
                                aria-label="Delete"
                                disabled={loading || saving || deleting}
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
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

                {[1, 2, 3].map((n) => (
                  <button
                    key={n}
                    className={`um-page-btn ${safePage === n ? 'is-active' : ''}`}
                    disabled={n > totalPages}
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </button>
                ))}

                {totalPages > 4 && <span className="um-ellipsis" aria-hidden="true">…</span>}

                <button
                  className={`um-page-btn ${safePage === Math.min(9, totalPages) ? 'is-active' : ''}`}
                  disabled={Math.min(9, totalPages) < 1 || Math.min(9, totalPages) > totalPages}
                  onClick={() => setPage(Math.min(9, totalPages))}
                >
                  {Math.min(9, totalPages)}
                </button>

                <button className="um-page-btn" disabled={safePage === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                  Next →
                </button>
              </div>
            </div>
          </Card>
        </div>

        {viewModal}
        {editModal}
        {deleteModal}
      </AdminPageLayout>
    </AdminLayout>
  );
}

