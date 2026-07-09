# TODO: RolePermissionsPage table refactor (rm-* styling)

## Steps
1. Refactor `login-signup/src/pages/RolePermissionsPage.jsx` ✅
   - Replace current 2-col role cards + category checkbox grid UI with a permissions-first `<table>` ✅
   - Reuse AdminRolesPage CSS conventions/classes (`rm-page`, `rm-shell`, `rm-card`, `rm-tableCard`, `rm-table`, `rm-thead`, `rm-tbody`, `rm-badge`, `rm-pagination`, etc.). ✅
   - Keep existing state/logic for: selected role, permission toggles, Select All, Clear, Save. ✅
2. Update `login-signup/src/pages/RolePermissionsPage.css` ✅
   - Remove/override page-specific dark styling; align visuals to light-only usage. ✅
   - Ensure only minimal custom styles remain (for permission toggle controls inside table rows, if needed). ✅
3. Consistency pass:
   - Review `/register-gateway` and any other admin pages that use the same dark-ish styling pattern and align them with `rm-*` light table/card styling (requires targeted file inspection).
   - Start after RolePermissionsPage table refactor is complete.
4. Validate:
   - Run `npm test` or `npm run build` in `login-signup`.
   - Manually verify `/admin/role-permissions` table columns and pagination + toggles.

