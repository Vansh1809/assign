# TODO - Admin Role Permissions UI refactor (UI-only)

## Information Gathered
- `login-signup/src/pages/RolePermissionsPage.jsx` currently mixes two UI styles:
  - A custom “Roles & Permissions” matrix editor (rp-* classes)
  - A “Role Management” table/grid (rm-* classes copied inline)
- `login-signup/src/pages/RolePermissionsPage.css` defines a large custom design system (rp-*) with some readable colors, but it also relies on rm-* markup that is not defined in this file.
- `login-signup/src/pages/AdminRolesPage.jsx` + `.css` define the new enterprise UI pattern using rm-* classes and matching typography/tokens.
- `login-signup/src/styles/theme.css` defines shared admin tokens (ad-*), typography (Inter), and accessible focus styles.

## Plan (UI-only)
### Step 1: Align layout structure to Role Management design system
- Update `RolePermissionsPage.jsx` markup to use the same structural components/classes as `AdminRolesPage.jsx`:
  - Page shell: `.rm-page`, `.rm-shell`, `.rm-card`
  - Header: `.rm-header`, `.rm-titleRow`, `.rm-actionsRow`, `.rm-kpiRow`, `.rm-kpi`
  - Toolbar: `.rm-sectionPad`, `.rm-searchRow`, `.rm-search`, `.rm-select`, `.rm-formLabel`
  - Table/pagination if present: `.rm-tableCard`, `.rm-tableWrap`, `.rm-table`, `.rm-thead`, `.rm-tbody`, `.rm-pagination`
  - Modals use existing `Modal` component behavior (do not alter backend calls).

### Step 2: Remove reliance on rm-* classes that are undefined in RolePermissionsPage.css
- Ensure RolePermissionsPage’s editor and roles area use only classes that exist (either:
  - reuse rm-* classes by importing/depending on AdminRolesPage.css; OR
  - port the required rm-* class rules into RolePermissionsPage.css in a minimal way).

### Step 3: Fix highest priority — text contrast (WCAG AA)
- Audit all text-bearing selectors in RolePermissionsPage.css:
  - role titles, permission names, section titles/subtitles, table headers/rows, breadcrumb/placeholder, badges/pills, pagination text.
- Replace any low-contrast colors (especially muted/tertiary) with token-based colors from `theme.css` or matching rm-* token values.
- Avoid “light gray on light background”. Use dark readable text on light cards and sufficiently bright text on dark backgrounds.

### Step 4: Reduce excessive whitespace and fix grid sizing
- Adjust rp-grid / rp-section padding/gaps to match rm-* spacing.
- Ensure the permissions panel expands and roles panel doesn’t waste horizontal space.
- On desktop, use a 2-column layout similar to AdminRolesPage where applicable.

### Step 5: Responsive behavior (table -> cards)
- Ensure roles list becomes cards on small screens like AdminRolesPage.
- Ensure permission categories grid collapses cleanly without horizontal scrolling.

### Step 6: Accessibility polishing
- Confirm visible focus states on interactive elements.
- Ensure inputs/checkboxes/toggles have accessible labels (they already have some aria-labels; preserve them).
- Add `aria-label` to key controls where missing (pagination buttons, select all toggles, etc.).

### Step 7: Do not modify backend logic
- Keep all fetch URLs/methods, auth usage, state logic, RBAC, routing, and permission editing logic unchanged.

## Dependent Files to Edit
- `login-signup/src/pages/RolePermissionsPage.jsx`
- `login-signup/src/pages/RolePermissionsPage.css`
- (Possibly) `login-signup/src/pages/AdminRolesPage.css` *only if* we can safely reuse rm-* without changing behavior.

## Followup steps
- Run `npm test` / `npm run build` inside `login-signup` (as appropriate) to ensure UI compiles.
- Manual QA: check contrast in both dark/light themes, resize to mobile widths.


