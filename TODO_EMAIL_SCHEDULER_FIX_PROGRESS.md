# Progress: Background email queue contract fix

## Step 1 (visibility): Improve logs for task failures
- Done ✅ (inMemoryQueue now logs error message + stack)

## Step 2 (validation): Make email env misconfig error explicit
- Done ✅ (emailService now reports missing EMAIL_USER/EMAIL_PASSWORD)


## Step 3 (verify): Restart background task service + run tests
- Done ✅
  - `test-welcome.js` + `test-forgot-password.js` now fail with explicit error in task JSON:
    `Email transporter not configured. Set EMAIL_USER and EMAIL_PASSWORD.`


