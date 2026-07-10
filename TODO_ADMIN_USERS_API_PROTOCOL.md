## TODO: Debug & fix AdminUsers updateUser crash

### Planned investigation
- [x] Identify backend PUT handler: `auth-backend/controllers/usersController.js:updateUser`
- [x] Identify frontend request payload: `login-signup/src/pages/AdminUsersPage.jsx:submitEdit`
- [x] Inspect Role model: `auth-backend/models/Role.js` (enum values)
- [ ] Implement fix once root cause confirmed (likely Role mapping)
- [ ] Add stronger error logging (include `err.stack` + request fields)

### Root-cause hypothesis
- [ ] Backend expects `role` enum `ADMIN|EDITOR|VIEWER` and maps them to Role names.
- [ ] `normalizeRoleForDb()` maps:
  - ADMIN -> 'Admin'
  - EDITOR -> 'Moderator'
  - VIEWER -> 'User'
- [ ] If Role catalog uses different names (e.g. 'Editor' instead of 'Moderator'), `Role.findOne()` returns null and throws 500.

### Next steps (code changes)
- [ ] Update `normalizeRoleForDb()` to map to the actual Role.name values found in the DB.
- [ ] Alternatively accept both `ADMIN|EDITOR|VIEWER` and Role.name values from frontend.
- [ ] Add backend logging for `roleDbName`, `fields.role`, and `err.stack`.

