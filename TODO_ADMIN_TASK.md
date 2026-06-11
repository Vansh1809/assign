# Admin backend + frontend wiring TODO

## Backend (auth-backend)
- [ ] Create `middleware/adminGuard.js` with `requireAdmin` using JWT role.
- [ ] Create `controllers/adminController.js` with `getAdminUsers`.
- [ ] Create `routes/adminRoutes.js` mounting `GET /api/admin/users`.
- [ ] Create `seedAdmin.js` to ensure Admin role exists and upsert an admin user (idempotent).
- [ ] Update `server.js` to mount `adminRoutes` and remove/stop using old `GET /api/users`.

## Frontend (login-signup)
- [ ] Create `routes/AdminRoute.jsx` guard (checks auth + role === 'Admin').
- [ ] Create `pages/AdminUsersPage.jsx` with users list/table and AI chat panel UI.
- [ ] Update `App.js` to wire `/admin/users` route protected by `AdminRoute`.

## Verification
- [ ] Run seed: `node auth-backend/seedAdmin.js`.
- [ ] Login as seeded admin and open `/admin/users`.
- [ ] Confirm admin users fetch works with Authorization header.

