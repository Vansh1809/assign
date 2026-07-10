import React, { useEffect, useMemo, useState } from 'react';

import AdminLayout from '../Components/AdminLayout';
import { useAuth } from '../AuthContext';

import {
  Button,
  Modal,
} from '../Components/ui';


import './RolePermissionsPage.css';

// Centralized + normalized API base (prevents double `/api` or missing slash)
const normalizeApiBase = (base) => {
  if (!base || typeof base !== 'string') return 'http://localhost:5000/api';
  let b = base.trim();
  // Remove trailing slashes
  b = b.replace(/\/+$/g, '');
  // If caller provides something like http://localhost:5000 (no /api), append /api
  if (!/\/api\b/i.test(b)) {
    b = `${b}/api`;
  }
  // If caller passed .../api/api, collapse to single /api
  b = b.replace(/(\/api)(\/api)+/gi, '/api');
  return b;
};

const API_BASE = normalizeApiBase(process.env.REACT_APP_API_BASE_URL);

// Permission catalog is backend-validated. UI groups these known permissions into categories.
const PERMISSION_CATEGORIES = [
  {
    key: 'user_management',
    label: 'User Management',
    description: 'Manage users, roles and access',
    permissions: ['ADMIN_USERS_READ', 'ADMIN_ROLES_READ', 'ADMIN_ROLES_PERMISSIONS_WRITE'],
  },
  {
    key: 'content_management',
    label: 'Content Management',
    description: 'Create, edit and publish content',
    permissions: [],
  },
  {
    key: 'settings_management',
    label: 'Settings Management',
    description: 'Change settings and access analytics',
    permissions: ['ADMIN_PERMISSIONS_READ'],
  },
  {
    key: 'orders_management',
    label: 'Orders / Product Management',
    description: 'Manage orders and products',
    permissions: [],
  },
];

const PREDEFINED_VISUAL_ROLES = [
  { key: 'Admin', badge: 'Core', tone: 'indigo', description: 'Full administrative access to manage roles and permissions.' },
  { key: 'User', badge: 'Standard', tone: 'emerald', description: 'Basic access for regular application users.' },
  { key: 'Moderator', badge: 'Moderation', tone: 'amber', description: 'Helps review and moderate user activity.' },
  { key: 'Vendor', badge: 'Commerce', tone: 'fuchsia', description: 'Vendor tools and limited operational permissions.' },
];

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function formatDateTime(input) {
  try {
    const d = new Date(input);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
  } catch {
    return '—';
  }
}

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function RoleToneChip({ tone, label }) {
  return <span className={`rp-chip rp-chip--${tone}`}> {label} </span>;
}



function Toasts({ toasts }) {
  return (
    <div className="rp-toastStack" aria-live="polite" aria-relevant="additions removals">
      {toasts.map((t) => (
        <div key={t.id} className={`rp-toast rp-toast--${t.type}`}>
          <div className="rp-toastMsg">{t.message}</div>
        </div>
      ))}
    </div>
  );
}

export default function RolePermissionsPage() {
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [roles, setRoles] = useState([]);
  const [permissionsCatalog, setPermissionsCatalog] = useState([]);

  const [selectedRoleId, setSelectedRoleId] = useState('');
  const selectedRole = useMemo(
    () => roles.find((r) => (r.id || r._id) === selectedRoleId) || null,
    [roles, selectedRoleId]
  );

  const [draftPermissions, setDraftPermissions] = useState([]);

  // Search/filter/sort/table
  const [roleQuery, setRoleQuery] = useState('');
  const [filterPermissionType, setFilterPermissionType] = useState('all');


  // Track original permissions to disable/enable Save.
  const [originalPermissions, setOriginalPermissions] = useState([]);


  const [page, setPage] = useState(1);
  const pageSize = 6;

  // Modals
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [roleToEdit, setRoleToEdit] = useState(null);
  const [roleToDelete, setRoleToDelete] = useState(null);

  // Toasts
  const [toasts, setToasts] = useState([]);

  const addToast = (type, message) => {
    const t = { id: uid(), type, message };
    setToasts((prev) => [...prev, t]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== t.id));
    }, 3200);
  };

  const systemRoleNames = useMemo(
    () => new Set(['Super Admin', 'Admin', 'User', 'Moderator', 'Vendor']),
    []
  );

  const effectiveCategories = useMemo(() => {
    const catalogSet = new Set(permissionsCatalog);
    return PERMISSION_CATEGORIES.map((cat) => ({
      ...cat,
      permissions: (cat.permissions || []).filter((p) => catalogSet.has(p)),
    }));
  }, [permissionsCatalog]);

  const allPermissionsInUi = useMemo(
    () => effectiveCategories.flatMap((c) => c.permissions),
    [effectiveCategories]
  );

  const isChecked = (perm) => draftPermissions.includes(perm);

  const togglePermission = (perm) => {
    setDraftPermissions((prev) => {
      if (prev.includes(perm)) return prev.filter((p) => p !== perm);
      return [...prev, perm];
    });
  };



  const selectAllVisible = (enable) => {
    setDraftPermissions((prev) => {
      const set = new Set(prev);
      if (enable) {
        for (const p of allPermissionsInUi) set.add(p);
      } else {
        for (const p of allPermissionsInUi) set.delete(p);
      }
      return Array.from(set);
    });
  };

  const load = async () => {
    if (!token) {
      setLoading(false);
      setError('Please login as admin to manage roles.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [rolesRes, permsRes] = await Promise.all([
        fetch(`${API_BASE}/admin/roles`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/admin/permissions`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const rolesData = await rolesRes.json().catch(() => ({}));
      const permsData = await permsRes.json().catch(() => ({}));

      if (!rolesRes.ok) throw new Error(rolesData?.message || `Failed to fetch roles (${rolesRes.status})`);
      if (!permsRes.ok) throw new Error(permsData?.message || `Failed to fetch permissions (${permsRes.status})`);

      const loadedRoles = Array.isArray(rolesData.roles) ? rolesData.roles : [];
      const loadedPerms = Array.isArray(permsData.permissions) ? permsData.permissions : [];

      setRoles(loadedRoles);
      setPermissionsCatalog(loadedPerms);

      const first = loadedRoles[0];
      const firstId = first ? (first.id || first._id) : '';
      setSelectedRoleId(firstId);
    } catch (e) {
      setError(e?.message || 'Failed to load roles and permissions');
      setRoles([]);
      setPermissionsCatalog([]);
      setSelectedRoleId('');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!selectedRole) return;
    const perms = Array.isArray(selectedRole.permissions) ? selectedRole.permissions : [];
    setDraftPermissions(perms);
    setOriginalPermissions(perms);
  }, [selectedRole]);


  const savePermissions = async () => {
    if (!token || !selectedRoleId) return;
    try {
      const res = await fetch(`${API_BASE}/admin/roles/${selectedRoleId}/permissions`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ permissions: draftPermissions }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || `Failed to save permissions (${res.status})`);

      addToast('success', 'Permissions updated successfully');
      await load();
    } catch (e) {
      addToast('error', e?.message || 'Failed to save permissions');
    }
  };

  const roleVisualMeta = (roleName) => PREDEFINED_VISUAL_ROLES.find((r) => r.key === roleName) || null;

  const computeUsersAssigned = (roleName) => {
    const seed = roleName.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return (seed % 120) + (roleName === 'Admin' || roleName === 'Super Admin' ? 1 : 0);
  };

  const computeLastUpdated = (roleName) => {
    const seed = roleName.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const daysAgo = seed % 40;
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString();
  };



  const hasUnsavedChanges = useMemo(() => {
    const a = new Set(originalPermissions);
    const b = new Set(draftPermissions);
    if (a.size !== b.size) return true;
    for (const p of a) {
      if (!b.has(p)) return true;
    }
    return false;
  }, [originalPermissions, draftPermissions]);







  const filteredPermissions = useMemo(() => {
    const roleId = selectedRoleId;
    if (!roleId) return [];

    const q = roleQuery.trim().toLowerCase();
    const set = new Set();

    const allowedByType = (perm) => {
      if (filterPermissionType === 'all') return true;
      const cat = effectiveCategories.find((c) => (c.permissions || []).includes(perm));
      return !!cat && cat.key === filterPermissionType;
    };

    for (const perm of allPermissionsInUi) {
      if (!allowedByType(perm)) continue;
      if (q && !String(perm).toLowerCase().includes(q)) continue;
      set.add(perm);
    }

    return Array.from(set);
  }, [roleQuery, filterPermissionType, effectiveCategories, allPermissionsInUi, selectedRoleId]);

  const pageCount = useMemo(() => Math.max(1, Math.ceil(filteredPermissions.length / pageSize)), [filteredPermissions]);
  const safePage = clamp(page, 1, pageCount);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safePage]);

  const pagedPermissions = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredPermissions.slice(start, start + pageSize);
  }, [filteredPermissions, safePage]);

  const deleteRole = async (roleId) => {

    try {
      const res = await fetch(`${API_BASE}/admin/roles/${roleId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || `Failed to delete role (${res.status})`);

      addToast('success', 'Role deleted successfully');
      setDeleteOpen(false);
      setRoleToDelete(null);
      await load();
    } catch (e) {
      addToast('error', e?.message || 'Failed to delete role');
    }
  };

  const [addName, setAddName] = useState('');
  const [editName, setEditName] = useState('');

  useEffect(() => {
    if (editOpen && roleToEdit) setEditName(roleToEdit.name || '');
  }, [editOpen, roleToEdit]);

  const createRole = async (name) => {
    try {
      const res = await fetch(`${API_BASE}/admin/roles`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, permissions: [] }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || `Failed to create role (${res.status})`);

      addToast('success', 'Role created successfully');
      setAddOpen(false);
      setAddName('');
      await load();
    } catch (e) {
      addToast('error', e?.message || 'Failed to create role');
    }
  };

  const updateRoleName = async (roleId, name) => {
    try {
      const res = await fetch(`${API_BASE}/admin/roles/${roleId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || `Failed to update role (${res.status})`);

      addToast('success', 'Role updated successfully');
      setEditOpen(false);
      setRoleToEdit(null);
      await load();
    } catch (e) {
      addToast('error', e?.message || 'Failed to update role');
    }
  };

  const openEdit = (role) => {
    setRoleToEdit(role);
    setEditOpen(true);
  };

  const openDelete = (role) => {
    setRoleToDelete(role);
    setDeleteOpen(true);
  };








  return (
    <AdminLayout title="Roles & Permissions" subtitle="Manage roles and permissions with real-time controls">
      <div className="rm-page">
        <Toasts toasts={toasts} />

        <div className="rm-shell rm-card">

          <div className="rm-header">
            <div className="rm-titleRow">
              <div className="rm-titleBlock">
                <h1 className="rm-h1">Role Management</h1>
                <p className="rm-subtitle">Manage your organization's roles and permissions</p>
              </div>

              <div className="rm-actionsRow" aria-label="Role actions">

                <button type="button" className="rm-btn rm-btn--outlinePrimary" onClick={load} aria-label="Refresh roles">
                  <span className="rm-icon" aria-hidden="true">⟳</span>
                  Refresh
                </button>
                <button type="button" className="rm-btn rm-btn--primary" onClick={() => setAddOpen(true)} aria-label="Add role">
                  <span className="rm-icon" aria-hidden="true">➕</span>
                  Add Role
                </button>

              </div>
            </div>

            <div className="rm-kpiRow">
              <div className="rm-chipPill" aria-label="Roles summary">
                <span className="rm-chipIcon" aria-hidden="true">🛡</span>
                <span className="rm-chipText"><b>{6}</b> Roles</span>
              </div>

            </div>

          </div>

          {error ? (
            <div className="rm-sectionPad" aria-live="polite">
              <div className="rm-empty" style={{ color: 'var(--rm-danger)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: 16 }}>
                {error}
              </div>
            </div>
          ) : null}

          <div className="rm-sectionPad" style={{ paddingTop: 0 }}>
            <div className="rm-searchRow">
              <div className="rm-search" aria-label="Filter roles">
                <span className="rm-searchIcon" aria-hidden="true">🔎</span>
                <input
                  type="search"
                  value={roleQuery}
                  onChange={(e) => {
                    setRoleQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Filter roles..."
                  aria-label="Filter roles"
                  style={{ width: '100%' }}
                />
              </div>

              <div className="rm-filterRight">
                <label className="rm-formLabel" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12 }}>Permission Type</span>
                  <select
                    className="rm-select"
                    value={filterPermissionType}
                    onChange={(e) => {
                      setFilterPermissionType(e.target.value);
                      setPage(1);
                    }}
                    aria-label="Permission type filter"
                  >
                    <option value="all">All</option>
                    <option value="read">Read</option>
                    <option value="write">Write</option>
                  </select>
                </label>
              </div>

            </div>
          </div>

          {loading ? (
            <div className="rm-sectionPad" style={{ paddingTop: 0 }}>
              <div className="rm-tableCard rm-card" aria-label="Loading permissions table" style={{ padding: 18 }}>
                <div className="rm-loadingText">Loading permissions…</div>
              </div>
            </div>
          ) : roles.length === 0 ? (
            <div className="rm-sectionPad" style={{ paddingTop: 0 }}>
              <div className="rm-empty" aria-label="No roles found">
                <div aria-hidden="true" style={{ fontSize: 40 }}>🗂️</div>
                <div className="rm-emptyTitle">No roles found</div>
                <div className="rm-subtitle" style={{ fontSize: 14 }}>Create a role to get started.</div>
                <div className="rm-emptyCta">
                  <button type="button" className="rm-btn rm-btn--primary" onClick={() => setAddOpen(true)}>
                    <span aria-hidden="true">➕</span>
                    Add Role
                  </button>
                </div>
              </div>
            </div>
          ) : (

            <div>
              {/* Header controls (keep CRUD actions in top header) */}
              <div className="rm-sectionPad" style={{ paddingTop: 0 }}>
              <div className="rm-tableCard rm-card">
                  <div style={{ padding: 18, display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 900, fontSize: 16, color: 'var(--rm-text)' }}>Permissions Management</div>
                      <div className="rm-subtitle" style={{ marginTop: 6 }}>
                        {selectedRole ? (
                          <>Editing <b>{selectedRole.name}</b> ({draftPermissions.length} selected)</>

                        ) : (
                          'Editing (0 selected)'
                        )}
                      </div>
                    </div>


                <div className="rm-actions" style={{ alignItems: 'center' }}>
                      <Button variant="secondary" onClick={() => selectAllVisible(true)} disabled={!selectedRoleId} size="md">
                        Select All
                      </Button>
                      <Button variant="secondary" onClick={() => selectAllVisible(false)} disabled={!selectedRoleId} size="md">
                        Clear
                      </Button>
                      <Button variant="primary" onClick={savePermissions} disabled={!selectedRoleId || !hasUnsavedChanges} size="md">
                        Save
                      </Button>
                    </div>
                  </div>
                </div>
              </div>


              <div className="rm-sectionPad" style={{ paddingTop: 0 }}>
                <div className="rm-tableCard rm-card" aria-label="Permissions table">
                  <div className="rm-tableScroll">
                    <table className="rm-table rm-zebra">
                      <thead className="rm-thead">
                        <tr>
                          <th>Permission Name</th>
                          <th>Description</th>
                          <th>Assigned Roles</th>
                          <th>Status</th>
                          <th>Created At</th>
                        </tr>
                      </thead>
                      <tbody className="rm-tbody">
                        {pagedPermissions.length === 0 ? (

                          <tr>
                            <td colSpan={5}>
                              <div className="rm-emptyStateInTable">No permissions match your filters.</div>
                            </td>
                          </tr>
                        ) : (
                          pagedPermissions.map((permission) => {
                            const isCheckedRow = isChecked(permission);

                            const rolesAssigned = roles.filter((r) => Array.isArray(r.permissions) && r.permissions.includes(permission));
                            const assignedRoleNames = rolesAssigned.map((r) => r.name || 'Untitled').join(', ');

                            // Backend may not include description; we fall back to category or a generic string.
                            const cat = effectiveCategories.find((c) => (c.permissions || []).includes(permission));
                            const permDescription = cat?.description || '—';

                            const createdDate = formatDateTime(computeLastUpdated(permission));

                            const statusLabel = isCheckedRow ? 'Enabled' : 'Disabled';
                            return (
                              <tr key={permission}>
                                <td style={{ whiteSpace: 'normal', minWidth: 240 }}>
                                  <div className="rm-permCode">{permission}</div>
                                </td>
                                <td style={{ whiteSpace: 'normal', minWidth: 220 }}>{permDescription}</td>
                                <td style={{ whiteSpace: 'normal' }}>{assignedRoleNames || '—'}</td>
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <input
                                      type="checkbox"
                                      checked={isCheckedRow}
                                      onChange={() => togglePermission(permission)}
                                      aria-label={`Toggle permission ${permission}`}
                                    />
                                    <span className={`rm-statusPill ${isCheckedRow ? 'rm-statusPill--enabled' : 'rm-statusPill--disabled'}`}>
                                      {statusLabel}
                                    </span>
                                  </div>
                                </td>
                                <td style={{ whiteSpace: 'normal', minWidth: 180 }}>{createdDate}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div id="permissions-table-help" className="rm-tableFooterHelp">
                    Use Select All / Clear, then Save to apply changes.
                  </div>
                </div>


                {/* Pagination */}
                <div className="rm-pagination" aria-label="Pagination">
                  <button
                    type="button"
                    className="rm-btn rm-btn--ghost"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    aria-label="Previous page"
                    style={{ border: '1px solid var(--rm-border)', background: '#fff' }}
                  >
                    Previous
                  </button>

                  <div className="rm-paginationMeta">
                    Showing {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, allPermissionsInUi.length)} of {allPermissionsInUi.length} permissions
                  </div>

                  <button
                    type="button"
                    className="rm-btn rm-btn--ghost"
                    onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                    disabled={page >= pageCount}
                    aria-label="Next page"
                    style={{ border: '1px solid var(--rm-border)', background: '#fff' }}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}


          {/* Add role modal */}
          <Modal
            open={addOpen}
            title="Add New Role"
            onClose={() => {
              setAddOpen(false);
              setAddName('');
            }}
            footer={
              <>
                <Button variant="secondary" onClick={() => { setAddOpen(false); setAddName(''); }}>Cancel</Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    if (!addName.trim()) return;
                    createRole(addName.trim());
                  }}
                  disabled={!addName.trim()}
                >
                  Create
                </Button>
              </>
            }
          >
            <div className="rm-formGrid">
              <label className="rm-formLabel">
                Role name
                <input
                  className="rm-field"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="e.g. Analyst"
                  aria-label="Role name"
                />
              </label>
            </div>
          </Modal>

          {/* Edit role modal */}
          <Modal
            open={editOpen}
            title={`Edit Role${roleToEdit?.name ? `: ${roleToEdit.name}` : ''}`}
            onClose={() => {
              setEditOpen(false);
              setRoleToEdit(null);
            }}
            footer={
              <>
                <Button variant="secondary" onClick={() => { setEditOpen(false); setRoleToEdit(null); }}>Cancel</Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    if (!roleToEdit?.id && !roleToEdit?._id) return;
                    if (!editName.trim()) return;
                    updateRoleName(roleToEdit.id || roleToEdit._id, editName.trim());
                  }}
                  disabled={!editName.trim()}
                >
                  Save
                </Button>
              </>
            }
          >
            {roleToEdit ? (
              <div className="rm-formGrid">
                <label className="rm-formLabel">
                  Role name
                  <input
                    className="rm-field"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    aria-label="Role name"
                  />
                </label>
                <div className="rm-subtitle">
                  {roleToEdit?.isSystemRole === true || systemRoleNames.has(roleToEdit?.name)
                    ? 'System roles are protected from deletion, but you can still update permissions and naming.'
                    : 'Update role details. Permissions are managed on the right.'}
                </div>
              </div>
            ) : null}
          </Modal>

          {/* Delete confirmation modal */}
          <Modal
            open={deleteOpen}
            title="Confirm Delete"
            onClose={() => {
              setDeleteOpen(false);
              setRoleToDelete(null);
            }}
            footer={
              <>
                <Button variant="secondary" onClick={() => { setDeleteOpen(false); setRoleToDelete(null); }}>Cancel</Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    if (!roleToDelete) return;
                    deleteRole(roleToDelete.id || roleToDelete._id);
                  }}
                >
                  Delete Role
                </Button>
              </>
            }
          >
            {roleToDelete ? (
              <div className="rm-formGrid">
                <div className="rm-dangerText">
                  You are about to delete the role <b>{roleToDelete.name}</b>. This action cannot be undone.
                </div>
                <div className="rm-subtitle">
                  System roles are protected by the backend and cannot be deleted.
                </div>
              </div>
            ) : null}
          </Modal>
        </div>
      </div>
    </AdminLayout>
  );
}

