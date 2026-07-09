# TODO - Role Management UI (Admin Dashboard)

- [ ] Replace `login-signup/src/pages/AdminRolesPage.jsx` with full “Role Management” page per spec.
- [ ] Add `login-signup/src/pages/AdminRolesPage.css` implementing SaaS enterprise styling:
  - [ ] 32px padding, max width 1400px, 8px grid system
  - [ ] rounded cards + soft shadows
  - [ ] table with sticky header, hover/zebra
  - [ ] responsive mobile card-per-row layout
  - [ ] loading skeleton rows
  - [ ] modals (Create/Edit/Delete/View Permissions)
  - [ ] tooltips + focus rings + light/dark compatibility
- [ ] Implement UI behavior:
  - [ ] API integration (fetch roles, create/edit/delete, refresh)
  - [ ] Search filter (role name + description)
  - [ ] Permissions badge opens View Permissions (modal or route)
  - [ ] Delete disabled for system roles
  - [ ] Pagination + rows per page selector
  - [ ] Empty state with Create Role CTA
- [ ] Enforce accessibility:
  - [ ] ARIA labels for inputs/buttons
  - [ ] keyboard focus rings
  - [ ] semantic markup (table/thead/tbody; buttons)
- [ ] Verify build/test in `login-signup`:
  - [ ] `npm test` (if available)
  - [ ] `npm run build` (if available)
  - [ ] Manual runtime smoke check: desktop + mobile layout

