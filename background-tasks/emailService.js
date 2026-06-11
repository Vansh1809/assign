const nodemailer = require('nodemailer');

const transporter = (() => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD;
  if (!user || !pass) return null;
  return nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
})();

async function sendEmail(to, subject, html, text) {
  if (!transporter) {
    const missing = [];
    if (!process.env.EMAIL_USER) missing.push('EMAIL_USER');
    if (!process.env.EMAIL_PASSWORD) missing.push('EMAIL_PASSWORD');

    throw new Error(
      `Email transporter not configured. Missing: ${missing.join(', ') || 'unknown vars'}. ` +
        `Set EMAIL_USER and EMAIL_PASSWORD (Gmail SMTP).`
    );
  }
  const info = await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, ''),
  });
  return info;
}

module.exports = sendEmail;
