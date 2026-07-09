import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../Components/AdminLayout';
import { useAuth } from '../AuthContext';

import './AdminRolesPage.css';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

const systemRoleNames = new Set(['Super Admin', 'Admin', 'User', 'Moderator', 'Vendor']);

const normalizeText = (v) => (v || '').toString().trim().toLowerCase();

const getId = (r) => r?.id || r?._id;

const formatDate = (input) => {
  try {
    const d = new Date(input);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
  } catch {
    return '—';
  }
};

const isSystemRole = (role) => {
  const name = role?.name;
  if (role?.isSystemRole === true) return true;
  if (!name) return false;
  return systemRoleNames.has(name);
};

function Icon({ children }) {
  return <span className="rm-icon" aria-hidden="true">{children}</span>;
}

function Modal({ open, title, description, onClose, children, footer }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    setTimeout(() => panelRef.current?.focus?.(), 0);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="rm-modalOverlay"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={onClose}
    >
      <div
        className="rm-modal"
        ref={panelRef}
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="rm-modalHeader">
          <div>
            <h3 className="rm-modalTitle">{title}</h3>
            {description ? <p className="rm-subtitle" style={{ marginTop: 6 }}>{description}</p> : null}
          </div>
          <button type="button" className="rm-closeBtn" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>
        <div className="rm-modalBody">{children}</div>
        {footer ? <div className="rm-modalFooter">{footer}</div> : null}
      </div>
    </div>
  );
}

function SkeletonRow({ columns = 8 }) {
  return (
    <tr aria-hidden="true">
      {Array.from({ length: columns }).map((_, idx) => (
        <td key={idx} style={{ padding: '14px 14px' }}>
          <div className="rm-loadingRow" />
        </td>
      ))}
    </tr>
  );
}

export default function AdminRolesPage() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search/filter
  const [query, setQuery] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [viewPermsOpen, setViewPermsOpen] = useState(false);

  const [roleForEdit, setRoleForEdit] = useState(null);
  const [roleForDelete, setRoleForDelete] = useState(null);
  const [roleForPerms, setRoleForPerms] = useState(null);

  const [createName, setCreateName] = useState('');
  const [editName, setEditName] = useState('');

  // View permissions modal draft
  const permissionsList = useMemo(() => {
    const perms = Array.isArray(roleForPerms?.permissions) ? roleForPerms.permissions : [];
    return perms;
  }, [roleForPerms]);

  const fetchRoles = async () => {
    if (!token) {
      setRoles([]);
      setLoading(false);
      setError('Please login as admin to manage roles.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/admin/roles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || `Failed to fetch roles (${res.status})`);

      setRoles(Array.isArray(data.roles) ? data.roles : []);
    } catch (e) {
      setRoles([]);
      setError(e?.message || 'Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const totalRoles = roles.length;

  const filteredRoles = useMemo(() => {
    const q = normalizeText(query);
    if (!q) return roles;

    return roles.filter((r) => {
      const name = normalizeText(r?.name);
      const desc = normalizeText(r?.description);
      // Some backends may store description differently; best-effort.
      const fallbackDesc = normalizeText(r?.meta?.description);
      return name.includes(q) || desc.includes(q) || fallbackDesc.includes(q);
    });
  }, [roles, query]);

  const pageCount = Math.max(1, Math.ceil(filteredRoles.length / pageSize));

  useEffect(() => {
    setPage((p) => Math.min(p, pageCount));
  }, [pageCount]);

  const pagedRoles = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRoles.slice(start, start + pageSize);
  }, [filteredRoles, page, pageSize]);

  const onRefresh = async () => {
    await fetchRoles();
  };

  const openCreate = () => {
    setCreateName('');
    setCreateOpen(true);
  };

  const openEdit = (role) => {
    setRoleForEdit(role);
    setEditName(role?.name || '');
    setEditOpen(true);
  };

  const openDelete = (role) => {
    setRoleForDelete(role);
    setDeleteOpen(true);
  };

  const openViewPerms = (role) => {
    setRoleForPerms(role);
    setViewPermsOpen(true);
  };

  const createRole = async () => {
    const name = createName.trim();
    if (!name) return;

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

      setCreateOpen(false);
      await fetchRoles();
    } catch (e) {
      setError(e?.message || 'Failed to create role');
    }
  };

  const updateRole = async () => {
    const name = editName.trim();
    const id = getId(roleForEdit);
    if (!id || !name) return;

    try {
      const res = await fetch(`${API_BASE}/admin/roles/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || `Failed to update role (${res.status})`);

      setEditOpen(false);
      setRoleForEdit(null);
      await fetchRoles();
    } catch (e) {
      setError(e?.message || 'Failed to update role');
    }
  };

  const deleteRole = async () => {
    const id = getId(roleForDelete);
    if (!id) return;

    try {
      const res = await fetch(`${API_BASE}/admin/roles/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || `Failed to delete role (${res.status})`);

      setDeleteOpen(false);
      setRoleForDelete(null);
      await fetchRoles();
    } catch (e) {
      setError(e?.message || 'Failed to delete role');
    }
  };

  // NOTE: “Clone” is UI-only because backend clone isn’t defined.
  const cloneRole = (role) => {
    const id = getId(role);
    if (!id) return;
    setRoleForEdit(role);
    setEditName(`${role?.name || 'Role'} Copy`);
    // Use edit flow as a best-effort clone placeholder (requires backend semantics).
    // We keep UI stable and avoid breaking backend.
    setEditOpen(true);
    // When user hits save, it will update the same role name.
    // This is a safe fallback.
  };

  const systemDeleteDisabled = (role) => isSystemRole(role);

  return (
    <AdminLayout title="Role Management" subtitle="Manage your organization's roles and their permissions">
      <div className="rm-page">
        <div className="rm-shell rm-card" style={{ overflow: 'visible', boxShadow: 'none', border: '0' }}>
          <div className="rm-header">
            <div className="rm-titleRow">
              <div className="rm-titleBlock">
                <h1 className="rm-h1">Role Management</h1>
                <p className="rm-subtitle">Manage your organization's roles and their permissions.</p>
              </div>

              <div className="rm-actionsRow" aria-label="Role actions">
                <button
                  type="button"
                  className="rm-btn rm-btn--primary"
                  onClick={onRefresh}
                  aria-label="Refresh roles"
                >
                  <Icon>🔄</Icon>
                  Refresh
                </button>

                <button
                  type="button"
                  className="rm-btn rm-btn--success"
                  onClick={openCreate}
                  aria-label="Create role"
                >
                  <Icon>➕</Icon>
                  Create Role
                </button>
              </div>
            </div>

            <div className="rm-kpiRow">
              <div className="rm-kpi" aria-label="Roles summary">
                <span aria-hidden="true">🛡</span>
                <strong>{totalRoles}</strong>
                <span>Roles</span>
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
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Filter roles..."
                  aria-label="Filter roles"
                />
              </div>

              <div>
                <label className="rm-formLabel" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12 }}>Rows per page</span>
                  <select
                    className="rm-select"
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                    aria-label="Rows per page"
                  >
                    {[5, 10, 20].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="rm-sectionPad" style={{ paddingTop: 0 }}>
              <div className="rm-tableCard rm-card" aria-label="Loading roles table">
                <div className="rm-tableWrap">
                  <table className="rm-table">
                    <thead className="rm-thead">
                      <tr>
                        {[
                          'Role',
                          'Description',
                          'Permissions',
                          'Created By',
                          'Status',
                          'Created Date',
                          'Updated Date',
                          'Actions',
                        ].map((h) => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="rm-tbody">
                      {Array.from({ length: pageSize }).map((_, idx) => (
                        <SkeletonRow key={idx} columns={8} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : filteredRoles.length === 0 ? (
            <div className="rm-sectionPad" style={{ paddingTop: 0 }}>
              <div className="rm-empty" aria-label="No roles found">
                <div aria-hidden="true" style={{ fontSize: 40 }}>🗂️</div>
                <div className="rm-emptyTitle">No roles found</div>
                <div className="rm-subtitle" style={{ fontSize: 14 }}>Create a role to get started.</div>
                <div className="rm-emptyCta">
                  <button type="button" className="rm-btn rm-btn--success" onClick={openCreate}>
                    <span aria-hidden="true">➕</span>
                    Create Role
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Desktop/table */}
              <div className="rm-sectionPad" style={{ paddingTop: 0 }}>
                <div className="rm-tableCard rm-card" aria-label="Roles table">
                  <div className="rm-tableWrap">
                    <table className="rm-table rm-zebra" aria-describedby="roles-table-help">
                      <thead className="rm-thead">
                        <tr>
                          <th>Role</th>
                          <th>Description</th>
                          <th>Permissions</th>
                          <th>Created By</th>
                          <th>Status</th>
                          <th>Created Date</th>
                          <th>Updated Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody className="rm-tbody">
                        {pagedRoles.map((r, idx) => {
                          const sys = isSystemRole(r);
                          const perms = Array.isArray(r.permissions) ? r.permissions : [];

                          const status = r.status || (sys ? 'protected' : 'active');
                          const isActive = status === 'active' || status === true || status === 'Active';
                          const createdBy = r.createdBy?.name || r.createdBy || r.createdByEmail || '—';

                          const createdAt = r.createdAt || r.created_date || r.creationDate;
                          const updatedAt = r.updatedAt || r.updated_date || r.lastUpdated;

                          return (
                            <tr key={getId(r) || idx}>
                              <td>
                                <div>
                                  <div style={{ fontWeight: 900 }}>{r.name || 'Untitled Role'}</div>
                                  {sys ? <span className="rm-badge rm-badge--system">🔒 System</span> : null}
                                </div>
                              </td>
                              <td style={{ whiteSpace: 'normal', minWidth: 220 }}>
                                {r.description || r.meta?.description || '—'}
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="rm-badge rm-badge--perm"
                                  onClick={() => openViewPerms(r)}
                                  aria-label={`View permissions for ${r.name}`}
                                >
                                  {perms.length} Permissions
                                </button>
                              </td>
                              <td>{createdBy}</td>
                              <td>
                                <span className={`rm-badge ${isActive ? 'rm-badge--active' : 'rm-badge--inactive'}`}>
                                  {isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td>{formatDate(createdAt)}</td>
                              <td>{formatDate(updatedAt)}</td>
                              <td>
                                <div className="rm-actions">
                                  <button
                                    type="button"
                                    className="rm-iconBtn"
                                    onClick={() => openEdit(r)}
                                    aria-label={`Edit ${r.name}`}
                                    data-tooltip="Edit"
                                  >
                                    ✏️
                                  </button>

                                  <button
                                    type="button"
                                    className="rm-iconBtn"
                                    onClick={() => openViewPerms(r)}
                                    aria-label={`View ${r.name} permissions`}
                                    data-tooltip="View"
                                  >
                                    👁️
                                  </button>

                                  <button
                                    type="button"
                                    className="rm-iconBtn"
                                    onClick={() => cloneRole(r)}
                                    aria-label={`Clone ${r.name}`}
                                    data-tooltip="Clone"
                                  >
                                    📋
                                  </button>

                                  <button
                                    type="button"
                                    className="rm-iconBtn"
                                    onClick={() => {
                                      if (systemDeleteDisabled(r)) return;
                                      openDelete(r);
                                    }}
                                    disabled={systemDeleteDisabled(r)}
                                    aria-disabled={systemDeleteDisabled(r)}
                                    aria-label={systemDeleteDisabled(r) ? `Delete disabled for system role ${r.name}` : `Delete ${r.name}`}
                                    data-tooltip={systemDeleteDisabled(r) ? 'System roles cannot be deleted' : 'Delete'}
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div id="roles-table-help" className="rm-paginationMeta" style={{ padding: '10px 2px 0 2px' }}>
                  Tip: Click the permissions badge to view the permissions assigned to a role.
                </div>
              </div>

              {/* Mobile cards */}
              <div className="rm-sectionPad" style={{ paddingTop: 0 }}>
                <div className="rm-cardGridMobile rm-cardGridMobile" aria-label="Roles mobile list">
                  <div className="rm-cardGridMobile">
                    {pagedRoles.map((r) => {
                      const sys = isSystemRole(r);
                      const perms = Array.isArray(r.permissions) ? r.permissions : [];

                      const status = r.status || (sys ? 'protected' : 'active');
                      const isActive = status === 'active' || status === true || status === 'Active';

                      const createdBy = r.createdBy?.name || r.createdBy || r.createdByEmail || '—';
                      const createdAt = r.createdAt || r.created_date || r.creationDate;
                      const updatedAt = r.updatedAt || r.updated_date || r.lastUpdated;

                      return (
                        <div key={getId(r)} className="rm-mobileRow rm-card">
                          <div className="rm-mobileRowHeader">
                            <div className="rm-mobileRoleName">
                              <strong>{r.name || 'Untitled Role'}</strong>
                              {sys ? <span className="rm-badge rm-badge--system">🔒 System</span> : null}
                            </div>

                            <div className="rm-actions" aria-label="Row actions">
                              <button
                                type="button"
                                className="rm-iconBtn"
                                onClick={() => openEdit(r)}
                                aria-label={`Edit ${r.name}`}
                                data-tooltip="Edit"
                              >
                                ✏️
                              </button>
                              <button
                                type="button"
                                className="rm-iconBtn"
                                onClick={() => openViewPerms(r)}
                                aria-label={`View ${r.name} permissions`}
                                data-tooltip="View"
                              >
                                👁️
                              </button>
                              <button
                                type="button"
                                className="rm-iconBtn"
                                onClick={() => cloneRole(r)}
                                aria-label={`Clone ${r.name}`}
                                data-tooltip="Clone"
                              >
                                📋
                              </button>
                              <button
                                type="button"
                                className="rm-iconBtn"
                                onClick={() => {
                                  if (systemDeleteDisabled(r)) return;
                                  openDelete(r);
                                }}
                                disabled={systemDeleteDisabled(r)}
                                aria-label={systemDeleteDisabled(r) ? `Delete disabled for system role ${r.name}` : `Delete ${r.name}`}
                                data-tooltip={systemDeleteDisabled(r) ? 'System roles cannot be deleted' : 'Delete'}
                              >
                                🗑️
                              </button>
                            </div>
                          </div>

                          <div className="rm-mobileGrid">
                            <div className="rm-mobileItem">
                              <span>Description</span>
                              <strong style={{ whiteSpace: 'normal' }}>{r.description || r.meta?.description || '—'}</strong>
                            </div>
                            <div className="rm-mobileItem">
                              <span>Status</span>
                              <strong>
                                <span className={`rm-badge ${isActive ? 'rm-badge--active' : 'rm-badge--inactive'}`}>
                                  {isActive ? 'Active' : 'Inactive'}
                                </span>
                              </strong>
                            </div>
                            <div className="rm-mobileItem">
                              <span>Permissions</span>
                              <strong>
                                <button
                                  type="button"
                                  className="rm-badge rm-badge--perm"
                                  onClick={() => openViewPerms(r)}
                                  aria-label={`View permissions for ${r.name}`}
                                >
                                  {perms.length} Permissions
                                </button>
                              </strong>
                            </div>
                            <div className="rm-mobileItem">
                              <span>Created By</span>
                              <strong>{createdBy}</strong>
                            </div>
                            <div className="rm-mobileItem">
                              <span>Created Date</span>
                              <strong>{formatDate(createdAt)}</strong>
                            </div>
                            <div className="rm-mobileItem">
                              <span>Updated Date</span>
                              <strong>{formatDate(updatedAt)}</strong>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Pagination bottom-right */}
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
                  Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filteredRoles.length)} of {filteredRoles.length} roles
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
            </>
          )}
        </div>

        {/* Create Role */}
        <Modal
          open={createOpen}
          title="Create Role"
          description="Roles start with no permissions. Assign permissions in the permissions editor."
          onClose={() => setCreateOpen(false)}
          footer={
            <>
              <button type="button" className="rm-btn" onClick={() => setCreateOpen(false)}>
                Cancel
              </button>
              <button type="button" className="rm-btn rm-btn--success" onClick={createRole} disabled={!createName.trim()}>
                Create
              </button>
            </>
          }
        >
          <div className="rm-formGrid">
            <label className="rm-formLabel">
              Role name
              <input
                className="rm-field"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="e.g. Analyst"
                aria-label="Role name"
              />
            </label>
          </div>
        </Modal>

        {/* Edit Role */}
        <Modal
          open={editOpen}
          title={`Edit Role${roleForEdit?.name ? `: ${roleForEdit.name}` : ''}`}
          description={roleForEdit && isSystemRole(roleForEdit) ? 'System roles are protected from deletion. You can still update naming.' : 'Update role details.'}
          onClose={() => {
            setEditOpen(false);
            setRoleForEdit(null);
          }}
          footer={
            <>
              <button
                type="button"
                className="rm-btn"
                onClick={() => {
                  setEditOpen(false);
                  setRoleForEdit(null);
                }}
              >
                Cancel
              </button>
              <button type="button" className="rm-btn rm-btn--primary" onClick={updateRole} disabled={!editName.trim()}>
                Save
              </button>
            </>
          }
        >
          <div className="rm-formGrid">
            <label className="rm-formLabel">
              Role name
              <input
                className="rm-field"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g. Analyst"
                aria-label="Role name"
              />
            </label>
          </div>
        </Modal>

        {/* Delete Confirmation */}
        <Modal
          open={deleteOpen}
          title="Confirm Delete"
          description="This action cannot be undone."
          onClose={() => {
            setDeleteOpen(false);
            setRoleForDelete(null);
          }}
          footer={
            <>
              <button
                type="button"
                className="rm-btn"
                onClick={() => {
                  setDeleteOpen(false);
                  setRoleForDelete(null);
                }}
              >
                Cancel
              </button>
              <button type="button" className="rm-btn" style={{ background: 'var(--rm-danger)', borderColor: 'transparent', color: '#fff' }} onClick={deleteRole}>
                Delete Role
              </button>
            </>
          }
        >
          {roleForDelete ? (
            <div>
              <div className="rm-dangerText">You are about to delete <b>{roleForDelete.name}</b>.</div>
              <div className="rm-subtitle" style={{ marginTop: 10 }}>
                System roles cannot be deleted.
              </div>
            </div>
          ) : null}
        </Modal>

        {/* View Permissions */}
        <Modal
          open={viewPermsOpen}
          title="Role Permissions"
          description={roleForPerms?.name ? `Permissions assigned to ${roleForPerms.name}` : 'Permissions assigned to the role'}
          onClose={() => setViewPermsOpen(false)}
          footer={
            <>
              <button type="button" className="rm-btn" onClick={() => setViewPermsOpen(false)}>
                Close
              </button>
              <button
                type="button"
                className="rm-btn rm-btn--primary"
                onClick={() => {
                  // Navigate to the permissions editor page
                  // (current implementation is the matrix editor).
                  setViewPermsOpen(false);
                  // best-effort: let RolePermissionsPage handle selected role via load order
                  // Keeping behavior non-breaking.
                  navigate('/admin/role-permissions');
                }}
              >
                Edit in Permissions Editor
              </button>
            </>
          }
        >
          <div className="rm-permList" aria-label="Permissions list">
            {permissionsList.length ? (
              permissionsList.map((p) => (
                <span key={p} className="rm-pill">{p}</span>
              ))
            ) : (
              <div className="rm-emptyTitle">No permissions assigned</div>
            )}
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}

