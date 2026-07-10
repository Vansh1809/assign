# TODO

- [x] Inspect frontend AdminUsersPage.jsx for View/Edit/Delete modal handlers and the exact fetch URLs.
- [x] Inspect backend auth-backend/routes/usersRoutes.js for registered endpoints.
- [x] Compare frontend fetch URL vs backend routes: frontend hits GET ${API_BASE}/api/users/:id; backend has GET /api/users/:id mounted under /api (so should be /api/users/:id).
- [x] Determine if 404 is due to API_BASE mismatch or id format.
- [x] Refactor View/Edit modals to avoid GET-by-id re-fetch; use the already-loaded row object.
- [x] Ensure Delete confirmation modal uses row.name from the row object.
- [x] Fix any endpoint base/path mismatch if re-fetch is still required (not needed for View/Edit).
- [ ] Update code and run a quick smoke test.



