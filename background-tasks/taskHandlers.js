const sendEmail = require("./emailService");
const templates = require("./emailTemplates");

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function escapeHtml(input) {
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function handlersSendEmail(payload) {
  const email = payload.email || payload.to || 'sk240461178@gmail.com';
  const templateType = payload.template || payload.templateType;
  const templateData = payload.templateData || {};

  if (payload.resetLink && !templateData.resetLink) {
    templateData.resetLink = payload.resetLink;
  }

const { subject, text, html } = templates[templateType]
    ? templates[templateType](templateData)
    : renderEmailTemplate(templateType, templateData);

  await wait(300);

  const result = await sendEmail(email, subject, html, text);

  return {
    message: `Email sent to ${email}`,
    email,
    subject,
    text,
    html,
    templateType,
    result
  };
}

async function generateReport(payload) {
  const reportName = payload.reportName || 'daily-summary';
  await wait(500);
  return {
    message: `Report generated: ${reportName}`,
    rowsProcessed: payload.rowsProcessed || 125
  };
}

async function cleanupUploads(payload) {
  await wait(200);
  return {
    message: 'Upload cleanup completed',
    olderThanDays: payload.olderThanDays || 30
  };
}

async function logMessage(payload) {
  const text = payload.text || 'Hello from the background worker';
  console.log(`[task:logMessage] ${text}`);
  return { message: text };
}

const handlers = {
  sendEmail: handlersSendEmail,
  generateReport,
  cleanupUploads,
  logMessage
};

async function runTask(type, payload = {}) {
  if (type === "send-email") {
    return handlers.sendEmail({
      email: payload.email,
      template: payload.template,
      resetLink: payload.resetLink,
      templateType: payload.templateType,
      templateData: {
        ...(payload.templateData || {}),
        ...(payload.username !== undefined ? { username: payload.username } : {}),
        ...(payload.password !== undefined ? { password: payload.password } : {})
      }
    });
  }

  if (type === 'sendEmail') {
    return handlers.sendEmail(payload);
  }

  const handler = handlers[type];
  if (!handler) {
    throw new Error("Unknown task type");
  }

  return handler(payload);
}

function renderEmailTemplate(templateType, templateData = {}) {
  const render = templates[templateType];
  if (render) return render(templateData);

  const siteName = templateData.siteName || 'Auth Service';
  const subject = 'Background task update';
  const text = 'No template matched.';
  const html = `<p>${escapeHtml(text)}</p>`;
  return { subject, text, html };
}

function listTaskTypes() {
  return ['send-email', ...Object.keys(handlers).filter((t) => t !== 'sendEmail')];
}

module.exports = {
  listTaskTypes,
  runTask
};
