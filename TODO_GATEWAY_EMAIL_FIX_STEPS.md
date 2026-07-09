# TODO: Fix Gateway Registration + Email Templates

- [ ] Fix `login-signup/src/pages/GatewayRegistration.jsx`
  - [ ] Make API base URL smart (avoid double `/api`)
  - [ ] Remove accidental `./DashboardPage.css` import
  - [ ] Apply `.register-gateway-page` wrapper class so CSS actually takes effect

- [ ] Fix background email template execution
  - [ ] Ensure `background-tasks/taskHandlers.js` correctly references `renderEmailTemplate`
  - [ ] If missing, import it from `background-tasks/emailTemplates.js`

- [ ] Validate endpoints
  - [ ] Start services and hit `/api/gateway/register`
  - [ ] Queue a test email from `EmailTemplatesAdminPage` and confirm `/tasks` works

