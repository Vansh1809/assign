# Admin Roles/Users/Permissions menu + remove static dashboard values

## Step 1 — Remove static dashboard values
- [ ] Update `login-signup/src/pages/DashboardPage.jsx`
  - Remove/replace hardcoded `STATS` cards
  - Remove/replace hardcoded `LOCATIONS` pinned list + map markers
  - Keep map/layer switching + admin users panel intact

## Step 2 — Add admin menu (Roles / Users / Permissions)
- [ ] Add shared sidebar menu component (e.g. `login-signup/src/Components/AdminMenu.jsx`)
- [ ] Update `login-signup/src/pages/AdminUsersPage.jsx` to render menu
- [ ] Update `login-signup/src/pages/EmailTemplatesAdminPage.jsx` to render menu
- [ ] Add navigation routes in `login-signup/src/App.js`
  - `/admin/roles`
  - `/admin/role-permissions`

## Step 3 — Add pages for Roles + Permissions (UI only / strict no-backend)
- [ ] Create `login-signup/src/pages/AdminRolesPage.jsx` with “Coming soon” UI
- [ ] Create `login-signup/src/pages/RolePermissionsPage.jsx` with “Coming soon” UI

## Step 4 — Verify
- [ ] Dashboard loads without static stats/locations
- [ ] Admin menu shows in admin pages
- [ ] New routes render without crashing

