# TODO_EMAIL_TEMPLATES (update)

## Goal
Add email templates for **welcome** and **forgot password** that:
1) Replace placeholders in subject/text/html with the recipient **name**, **siteName** and **credentials** (username + password) provided by the auth flow.
2) Ensure the background worker sends the email using the queued template.

## Current status
- ✅ `background-tasks/emailTemplates.js` has `welcome`, `reminder`, `forgotPassword` templates.
- ✅ `background-tasks/taskHandlers.js` supports `send-email` jobs.
- ✅ `login-signup/src/pages/EmailTemplatesAdminPage.jsx` can queue emails.

## Remaining work (required)
- [ ] Update `background-tasks/emailTemplates.js`:
  - [ ] Modify `welcome` template to include credentials placeholders: `{{username}}` and `{{password}}`.
  - [ ] Modify `forgotPassword` template if it also needs username/password.
- [ ] Update queue payload mapping in `background-tasks/taskHandlers.js`:
  - [ ] Ensure `templateData.username/password` passed in `payload.templateData` are preserved.
  - [ ] Ensure `runTask('send-email')` passes through all `templateData` fields.
- [ ] Wire actual auth flow:
  - [ ] Find where registration + password reset events are created and queued.
  - [ ] Update those calls to enqueue `send-email` with `template: 'welcome'` (and correct `templateData` incl. username/password).
  - [ ] Update reset flow to enqueue `send-email` with `template: 'forgotPassword'`.

## Verification
- [ ] Trigger welcome email via `POST /tasks` with username/password and verify the email content.
- [ ] Trigger forgot password email via `POST /tasks` and verify reset link + any extra fields.
- [ ] Run background task service and confirm it sends the email.

