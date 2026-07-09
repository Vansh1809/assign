# TODO_UI_THEME_CONSISTENCY_FIX.md

## Goal
Ensure all admin routes render inside the same Dashboard (SB Admin 2 light) layout and remove dark theme wrappers.

## Steps
1. Verify current layout components:
   - `login-signup/src/Components/AdminLayout.jsx` should be the shared master layout.
   - `login-signup/src/pages/DashboardPage.jsx` should remain the source-of-truth styling.
2. Identify pages that currently use dark inline styles / wrappers.
   - `AdminRolesPage.jsx` (dark wrapper) -> replace with `AdminLayout`.
   - `RolePermissionsPage.jsx` (dark wrapper) -> replace with `AdminLayout`.
   - `EmailTemplatesAdminPage.jsx` (dark wrapper) -> replace with `AdminLayout`.
3. Ensure route mapping is correct:
   - `/admin/role-permissions` must render `RolePermissionsPage.jsx`.
   - `/admin/email` must render `EmailTemplatesAdminPage.jsx`.
   - `/admin/users` must render `AdminUsersPage.jsx`.
4. Sidebar consistency:
   - Sidebar should only come from `AdminLayout`.
   - Remove any extra sidebar instances on the admin pages.
5. Remove dark backgrounds:
   - Delete hard-coded `#0f172a`, `#111827`, `#1e293b` backgrounds from admin pages.
6. Reuse existing Dashboard CSS classes only:
   - Use `sb-dashboard-grid`, `sb-panel`, `sb-panel-header`, etc.
   - Do not create new theme/CSS files.
7. Active menu highlight:
   - Ensure only the menu item corresponding to current pathname has `.active` class (handled by `AdminLayout`).

## Progress
- [x] AdminRolesPage.jsx migrated from dark wrapper to `AdminLayout`.
- [ ] RolePermissionsPage.jsx migration.
- [ ] EmailTemplatesAdminPage.jsx migration.
- [ ] Remove any remaining dark wrapper usage in other routes: `/gateway`, `/devices`, `/map-view` if applicable.

