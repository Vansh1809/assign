# TODO: Admin user + Dashboard user listing

- [x] Update `auth-backend/server.js`:
  - [x] Add JWT creation to `/api/login` response (return token)
  - [x] Add auth middleware to protect `/api/users`
  - [x] Add role-check so only `Admin` can list users
  - [x] Implement `GET /api/users` returning list of users with role names


- [x] Update `login-signup/src/AuthContext.js`:
  - [x] Store auth token returned by backend login
  - [x] Provide token in headers for authenticated calls

- [x] Update `login-signup/src/pages/DashboardPage.jsx`:
  - [x] If logged-in user role is `Admin`, fetch and render a Users table/panel
  - [x] Handle loading/error states


- [ ] Validate end-to-end:
  - [ ] Create an admin user via signup (set role to Admin)
  - [ ] Login and confirm users list appears on `/dashboard`

