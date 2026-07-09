# TODO: Role Management → Permissions page redesign

## Step 1: Update `RolePermissionsPage.jsx`
- Fix header title/subtitle and right-aligned CTAs (Refresh outline blue + sync icon, Add Role solid blue).
- Add summary chip “6 Roles” with shield icon.
- Update filter row: left full-width search input and right Permission Type dropdown with All/Read/Write.
- Update Permissions Management panel: remove redundant toggle; keep only Select All / Clear / Save.
- Implement Save disable logic until draft differs from original selectedRole.permissions.
- Improve table rendering: horizontally scrollable wrapper + sticky header.
- Remove skeleton rows; show empty state only when filtered permissions list is actually empty.
- Add zebra striping + row hover.
- Add footer helper tip (left) + pagination (right) with better contrast/bordered buttons.
- Use dummy data fallback when API results are unavailable.

## Step 2: Update `RolePermissionsPage.css`
- Align typography/radius/shadow with SB Admin 2 app look.
- Ensure horizontal scroll and sticky header styling.
- Style status pills: ENABLED green / DISABLED grey.
- Implement table zebra/hover.
- Adjust pagination/button contrast.

## Step 3: Validate
- Run app and verify layout and interactions on `/admin/role-permissions`.
- Ensure no redundant selection toggle remains.
- Verify empty state behavior.

