# TODO - AdminUsersPage.jsx fixes

## Step 1: Debug API 404
- [x] Identify mismatch: frontend calls `/api/admin/users` but backend exposes `/api/users`.
- [x] Update AdminUsersPage.jsx list fetch endpoint to `/api/users`.

## Step 2: KPI cards derived from real data
- [ ] Compute:
  - Total users = users.length
  - Active users = count where status === 'Active'
  - Locked users = count based on status field (best-effort)
  - New this month = createdAt within last 30 days
- [ ] Remove hardcoded KPI object.

## Step 3: Loading + proper error UI
- [ ] Add KPI skeleton/spinner while loading.
- [ ] Replace plain error text with styled error card consistent with other admin pages.
- [ ] Add Retry button to call fetchUsers().

## Step 4: Theme + datatable consistency
- [ ] Ensure styles/classes match existing AdminUsersPage.css and table conventions.

## Step 5: Verify
- [ ] Confirm table loads from `/admin/users`.
- [ ] Confirm KPIs match fetched dataset.
- [ ] Confirm Retry works on failures.

