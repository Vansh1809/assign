# TODO: Roles & Permissions Admin Dashboard Fix

## Phase 1 — API integration + 404 fixes
- [x] Normalize frontend API base URL joining (avoid double `/api` / missing slash)
- [x] Centralize API config for RolePermissionsPage (still respects `REACT_APP_API_BASE_URL`)


## Phase 2 — Backend RBAC + roles
- [x] Ensure backend role seeding creates system roles with `isSystemRole: true` for Admin/User/Moderator/Vendor (and align with UI)
- [ ] Add structured JSON error responses (`success: false, message: ...`) + correct status codes
- [ ] Prevent deletion of system roles: return 403 with proper message (already partially present; verify all paths)
- [ ] Add request validation for role create/update/permissions update



## Phase 3 — Frontend UI/UX (premium modal + errors)
- [ ] Replace/upgrade modal backdrop: dark overlay + backdrop blur + correct z-index
- [ ] Fix modal visual hierarchy: panel surface, shadow, border, padding, hierarchy
- [ ] Improve typography/contrast: placeholders, labels, disabled look
- [ ] Redesign error alert for Add Role modal (red alert card, icon, retry/dismiss)
- [ ] Avoid duplicate toasts for repeated identical errors
- [ ] Accessibility: focus trap basics, ESC to close (already partial), aria labels

## Verification
- [ ] Load roles (GET) works
- [ ] Add role (POST) works
- [ ] Delete system role returns 403 and UI blocks
- [ ] Modal layering no longer shows distracting background content

