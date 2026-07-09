# TODO_ROLE_PERMISSIONS_UI_FIX.md

## Goal
Make `RolePermissionsPage` pixel-for-pixel match `AdminRolesPage` layout and design system.

## Steps
- [ ] 1. Update `RolePermissionsPage.jsx` markup to reuse the `rm-*` shell/layout/header/button/search/card classes from `AdminRolesPage`.
- [ ] 2. Implement the correct desktop two-column layout (≈35% left roles list, ≈65% right permission editor) using flex/grid inside the same constrained container.
- [ ] 3. Remove/avoid `rp-*`-specific layout wrappers that create blank whitespace or overflow.
- [ ] 4. Refactor `RolePermissionsPage.css` to stop redefining a parallel design system; instead reuse `rm-*` tokens/classes and only keep the minimum page-specific rules.
- [ ] 5. Fix overflow + consistent card sizing for permission category cards and checkbox grid.
- [ ] 6. Verify responsive behavior: desktop 2-column, tablet/mobile stacked, no horizontal scrolling.
- [ ] 7. Sanity check text contrast / typography visibility (no white/low-opacity on white).

