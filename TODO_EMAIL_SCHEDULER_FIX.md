# TODO: Background email queue contract fix

## Completed
- Aligned queue payload/type contract to support:
  - `type: 'send-email'`
  - `payload: { email, template, resetLink?, templateData? }`
- Updated `background-tasks/server.js` daily reminder scheduling to enqueue `send-email` with `{ email, template: 'reminder', templateData }`.
- Updated `background-tasks/test-welcome.js` and `background-tasks/test-forgot-password.js` to use the new contract.
- Updated `background-tasks/taskHandlers.js`:
  - Made `runTask('send-email', ...)` delegate to the `sendEmail` handler using the same payload contract.
  - Added backwards compatibility for legacy `type: 'sendEmail'`.
  - Ensured `listTaskTypes()` returns `send-email`.

## Remaining
- Wire Step 5 (welcome) and Step 6 (forgot password) into the actual registration and password reset flows in your auth backend.
- (Optional) Replace current Step 7 single-recipient reminders with DB-driven per-user reminders (`User.find()`), once the correct User model/DB access layer is confirmed.

