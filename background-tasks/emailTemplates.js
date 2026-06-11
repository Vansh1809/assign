function escapeHtml(input) {
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#039;');
}

function htmlWrapper(bodyContent, footerText) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email</title>
</head>
<body style="margin:0;padding:0;background:#f6f7fb;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f6f7fb;">
    <tr>
      <td align="center" style="padding:24px 0;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:32px 24px 24px;">
              ${bodyContent}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5;">${escapeHtml(footerText)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

const templates = {
  welcome(templateData = {}) {
    const siteName = escapeHtml(templateData.siteName || 'Auth Service');
    const name = escapeHtml(templateData.name || 'there');

    const username = escapeHtml(templateData.username ?? '');
    const password = escapeHtml(templateData.password ?? '');

    const subject = `Welcome to ${siteName}!`;

    const credentialsBlock = (templateData.username || templateData.password)
      ? `
        <h2 style="margin:20px 0 10px;color:#111827;font-size:16px;font-weight:800;">Your account details</h2>
        <p style="margin:0 0 6px;color:#374151;font-size:14px;line-height:1.6;">Username: <span style="font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace;">${username || '-'}</span></p>
        <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;">Password: <span style="font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace;">${password || '-'}</span></p>
      `
      : '';

    const text = `Hi ${templateData.name || ''},\n\nWelcome to ${siteName}! We're excited to have you on board.\n\n` +
      (templateData.username || templateData.password
        ? `Your account credentials are:\nUsername: ${templateData.username || ''}\nPassword: ${templateData.password || ''}\n\n`
        : '') +
      `Thanks,\n${siteName} Team`;

    const body = `
      <h1 style="margin:0 0 16px;color:#111827;font-size:24px;font-weight:800;">Welcome, ${name}!</h1>
      <p style="margin:0 0 12px;color:#374151;font-size:15px;line-height:1.6;">Thanks for creating your account with ${siteName}.</p>
      <p style="margin:0;color:#374151;font-size:15px;line-height:1.6;">You can now sign in and start using the service.</p>
      ${credentialsBlock}
    `;

    return { subject, text, html: htmlWrapper(body, `— ${siteName} Team`) };
  },

  reminder(templateData = {}) {
    const siteName = escapeHtml(templateData.siteName || 'Auth Service');
    const name = escapeHtml(templateData.name || 'there');
    const message = escapeHtml(templateData.message || 'Just a friendly reminder to check your account.');
    const subject = templateData.subject ? escapeHtml(templateData.subject) : `Reminder from ${siteName}`;

    const text = `Hi ${templateData.name || ''},\n\n${templateData.message || 'Just a friendly reminder to check your account.'}\n\nThanks,\n${siteName} Team`;

    const body = `
      <h1 style="margin:0 0 16px;color:#111827;font-size:22px;font-weight:800;">Hi ${name} 👋</h1>
      <p style="margin:0;color:#374151;font-size:15px;line-height:1.6;">${message}</p>
    `;

    return { subject, text, html: htmlWrapper(body, `— ${siteName} Team`) };
  },

  forgotPassword(templateData = {}) {
    const siteName = escapeHtml(templateData.siteName || 'Auth Service');
    const name = escapeHtml(templateData.name || 'there');
    const resetLink = escapeHtml(templateData.resetLink || '#');

    const subject = 'Reset your password';
    const text = `Hi ${templateData.name || ''},\n\nWe received a request to reset your password.\n\nReset link: ${templateData.resetLink || '#'}\n\nIf you didn't request this, you can ignore this email.\n\nThanks,\n${siteName} Team`;

    const body = `
      <h1 style="margin:0 0 12px;color:#111827;font-size:22px;font-weight:800;">Password reset</h1>
      <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">Hi ${name}, we received a request to reset your password.</p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td style="border-radius:10px;background:#2563eb;text-align:center;">
            <a href="${resetLink}" style="display:inline-block;padding:12px 18px;color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px;">Reset password</a>
          </td>
        </tr>
      </table>
      <p style="margin:16px 0 0;color:#6b7280;font-size:13px;line-height:1.5;">If you didn't request this, you can ignore this email.</p>
    `;

    return { subject, text, html: htmlWrapper(body, `— ${siteName} Team`) };
  },
};

function renderEmailTemplate(templateType, templateData = {}) {
  const render = templates[templateType];
  if (render) return render(templateData);

  const fallbackText = 'No template matched.';
  const subject = 'Background task update';
  const html = htmlWrapper(`<p>${escapeHtml(fallbackText)}</p>`, 'Auth Service Team');
  const text = fallbackText;
  return { subject, text, html };
}

module.exports = { renderEmailTemplate, templates };

