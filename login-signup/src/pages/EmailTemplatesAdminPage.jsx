import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../AuthContext';

const API_BASE = process.env.REACT_APP_TASKS_API_BASE || 'http://localhost:4000';


function templateConfig(template) {
  if (template === 'welcome') {
    return {
      title: 'Welcome Email',
      subject: 'Welcome to {{siteName}}!',
      fields: ['name', 'siteName', 'username', 'password'],
      type: 'send-email',
      payloadTemplateKey: 'welcome'
    };
  }

  if (template === 'forgotPassword') {
    return {
      title: 'Forgot Password Email',
      subject: 'Reset your password',
      fields: ['name', 'siteName', 'resetLink'],
      type: 'send-email',
      payloadTemplateKey: 'forgotPassword'
    };
  }

  if (template === 'reminder') {
    return {
      title: 'Daily Reminder Email',
      subject: 'Reminder from {{siteName}}',
      fields: ['message', 'siteName', 'name'],
      type: 'send-email',
      payloadTemplateKey: 'reminder'
    };
  }

  return null;
}

export default function EmailTemplatesAdminPage() {
  const { user, token } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const [templateType, setTemplateType] = useState('welcome');
  const cfg = useMemo(() => templateConfig(templateType), [templateType]);

  const [toEmail, setToEmail] = useState('');
  const [name, setName] = useState('');
  const [siteName, setSiteName] = useState('GeoBoard');
  const [resetLink, setResetLink] = useState('');
  const [message, setMessage] = useState('This is your scheduled reminder.');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');


  const resetForm = () => {
    setToEmail('');
    setName('');
    setSiteName('GeoBoard');
    setResetLink('');
    setMessage('This is your scheduled reminder.');
    setUsername('');
    setPassword('');
  };

  useEffect(() => {
    resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateType]);

  const availableTemplateTypes = ['welcome', 'forgotPassword', 'reminder'];

  const canSend = useMemo(() => {
    if (!cfg) return false;
    if (!toEmail.trim()) return false;

    const required = cfg.fields;
    for (const f of required) {
      if (f === 'name' && !name.trim()) return false;
      if (f === 'siteName' && !siteName.trim()) return false;
      if (f === 'resetLink' && !resetLink.trim()) return false;
      if (f === 'message' && !message.trim()) return false;
      if (f === 'username' && !username.trim()) return false;
      if (f === 'password' && !password.trim()) return false;
    }

    return true;
  }, [cfg, toEmail, name, siteName, resetLink, message, username, password]);

  const sendNow = async (e) => {
    e.preventDefault();
    if (!canSend) return;

    setLoading(true);
    setError(null);

    try {
      // Background tasks service expects:
      // POST /tasks
      // body: { type:'send-email', payload:{ email, template, resetLink?, templateData:{...}} }
      const templateData = {
        name,
        siteName,
        message,
        username: username || undefined,
        password: password || undefined
      };
      if (templateType === 'forgotPassword') {
        templateData.resetLink = resetLink;
      }

      // The backend endpoint for tasks is usually /tasks or /api/tasks. 
      // Based on the error "Cannot POST /api/tasks", we try /tasks.
      const res = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'send-email',
          payload: {
            email: toEmail,
            template: cfg.payloadTemplateKey,
            templateData
          }
        })
      });

      // Some deployments may return HTML (e.g., 404/500 pages). Handle non-JSON safely.
      const contentType = res.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');
      const data = isJson ? await res.json() : { raw: await res.text() };

      if (res.status === 404) {
        throw new Error('Failed to fetch: Server endpoint not found (404)');
      }

      if (!res.ok || !data.id) {
        const msg = data?.error || data?.message || (data?.raw ? String(data.raw).slice(0, 500) : null);
        throw new Error(msg || 'Failed to queue email');
      }


      setToast(`Queued: ${data.id}`);
    } catch (err) {
      if (err.message.includes('Failed to fetch') || err.message.includes('blocked by CORS')) {
        setError('CORS Error: The background service at port 4000 must allow origin http://localhost:3000');
      } else {
      setError(err.message || 'Failed to queue');
      }
    } finally {
      setLoading(false);
      setTimeout(() => setToast(null), 2500);
    }
  };

  return (
    <div style={styles.pageRoot}>
      <div style={styles.header}>
        <div>
          <div style={styles.headerTitle}>✉️ Email Scheduler / Templates</div>
          <div style={styles.headerSubtitle}>Queue welcome / forgot password / reminders</div>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.userBadge}>{user?.email || 'Guest'}</div>
        </div>
      </div>

      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.cardTitle}>Queue an Email</div>
          <div style={styles.cardSub}>This UI calls background-tasks: POST {API_BASE}/tasks</div>

          <form onSubmit={sendNow} style={styles.form}>
            <label style={styles.label}>Template</label>
            <select
              value={templateType}
              onChange={(e) => setTemplateType(e.target.value)}
              style={styles.input}
            >
              {availableTemplateTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <label style={styles.label}>To (email)</label>
            <input
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
              placeholder="recipient@gmail.com"
              style={styles.input}
            />

            <label style={styles.label}>Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Vansh"
              style={styles.input}
            />

            <label style={styles.label}>Site name</label>
            <input
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="Auth Service"
              style={styles.input}
            />

            {templateType === 'welcome' && (
              <>
                <label style={styles.label}>Username</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                  style={styles.input}
                />

                <label style={styles.label}>Password</label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="password"
                  style={styles.input}
                />
              </>
            )}

            {templateType === 'forgotPassword' && (
              <>
                <label style={styles.label}>Reset link</label>
                <input
                  value={resetLink}
                  onChange={(e) => setResetLink(e.target.value)}
                  placeholder="https://.../reset-password?token=..."
                  style={styles.input}
                />
              </>
            )}

            {templateType === 'reminder' && (
              <>
                <label style={styles.label}>Reminder message</label>
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="This is your scheduled reminder."
                  style={styles.input}
                />
              </>
            )}

            {error && <div style={styles.error}>{error}</div>}
            {toast && <div style={styles.toast}>{toast}</div>}

            <button type="submit" disabled={!canSend || loading} style={styles.button}>
              {loading ? 'Queuing...' : 'Send / Queue Now'}
            </button>
          </form>
        </div>

        <div style={styles.card}>
          <div style={styles.cardTitle}>How it works</div>
          <div style={styles.cardBodyText}>
            <ul style={{ margin: 0, paddingLeft: 18, color: '#cbd5e1', lineHeight: 1.7 }}>
              <li>
                Server endpoint: <code>{API_BASE}/tasks</code>
              </li>
              <li>
                Task type used: <code>send-email</code>
              </li>
              <li>
                Payload: <code>{`{ email, template, templateData }`}</code>
              </li>
              <li>
                Background worker picks up the job and sends via Gmail (nodemailer)
              </li>
            </ul>
          </div>

          <div style={styles.hint}>
            Notes: This page queues emails. Daily reminders are scheduled automatically inside
            <code>background-tasks/server.js</code> at 10:00 and 17:00.
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  pageRoot: {
    minHeight: '100vh',
    background: '#0f172a',
    color: '#e2e8f0',
    padding: 16,
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '12px 14px',
    border: '1px solid #334155',
    borderRadius: 12,
    background: '#1e293b',
    marginBottom: 14,
  },
  headerTitle: { fontWeight: 900, fontSize: 16 },
  headerSubtitle: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 10 },
  userBadge: {
    border: '1px solid #334155',
    background: '#0f172a',
    padding: '8px 12px',
    borderRadius: 999,
    fontWeight: 800,
    fontSize: 12,
    color: '#e2e8f0',
  },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'start' },
  card: {
    border: '1px solid #334155',
    borderRadius: 12,
    background: '#1e293b',
    padding: 14,
  },
  cardTitle: { fontWeight: 900, fontSize: 14, marginBottom: 6 },
  cardSub: { color: '#94a3b8', fontSize: 12, marginBottom: 12 },
  form: { display: 'flex', flexDirection: 'column', gap: 10 },
  label: { fontSize: 12, color: '#cbd5e1', fontWeight: 800 },
  input: {
    padding: '10px 12px',
    borderRadius: 12,
    border: '1px solid #334155',
    background: '#0f172a',
    color: '#e2e8f0',
    outline: 'none',
  },
  button: {
    marginTop: 8,
    background: '#6366f1',
    border: 'none',
    color: '#fff',
    padding: '12px 16px',
    borderRadius: 12,
    cursor: 'pointer',
    fontWeight: 900,
  },
  error: {
    marginTop: 6,
    padding: '10px 12px',
    borderRadius: 12,
    border: '1px solid rgba(251,113,133,0.5)',
    background: 'rgba(251,113,133,0.12)',
    color: '#fb7185',
    fontWeight: 800,
  },
  toast: {
    marginTop: 6,
    padding: '10px 12px',
    borderRadius: 12,
    border: '1px solid rgba(99,102,241,0.5)',
    background: 'rgba(99,102,241,0.12)',
    color: '#c7d2fe',
    fontWeight: 900,
  },
  cardBodyText: { color: '#cbd5e1', fontSize: 13, lineHeight: 1.6 },
  hint: {
    marginTop: 12,
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 1.55,
  }
};
