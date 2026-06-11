require('dotenv').config();

console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? 'FOUND' : 'MISSING');

const express = require('express');
const createQueue = require('./createQueue');
const { listTaskTypes, runTask } = require('./taskHandlers');

// If you don't have Redis running, this service will automatically fall back to the
// in-memory scheduler. Any Redis connection errors are handled inside createQueue.js.


const PORT = process.env.TASK_PORT || 4000;

function getNextRunAt({ hour, minute }) {
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

function scheduleDailyReminder({ queue, to, templateData, hour, minute }) {
  const run = async () => {
    const runAt = getNextRunAt({ hour, minute });
    await queue.add({
      type: 'send-email',
      payload: {
        email: to,
        template: 'reminder',
        templateData
      },
      runAt: runAt.toISOString()
    });

    const delay = Math.max(0, runAt.getTime() - Date.now());
    setTimeout(run, delay + 1000); // add buffer so we always schedule the next run
  };

  return run().catch((err) => {
    console.error('Failed to schedule reminder:', err);
  });
}


function validateTaskRequest(req, res, next) {
  const { type, runAt, delayMs } = req.body;

  if (!type) {
    return res.status(400).json({ error: 'Task type is required' });
  }

  if (!listTaskTypes().includes(type)) {
    return res.status(400).json({
      error: `Unknown task type "${type}"`,
      availableTaskTypes: listTaskTypes()
    });
  }

  if (runAt && Number.isNaN(new Date(runAt).getTime())) {
    return res.status(400).json({ error: 'runAt must be a valid date/time' });
  }

  if (delayMs !== undefined && (Number.isNaN(Number(delayMs)) || Number(delayMs) < 0)) {
    return res.status(400).json({ error: 'delayMs must be a positive number' });
  }

  next();
}

async function main() {
  const app = express();
  const { driver, queue } = await createQueue({ runTask });

  app.use(express.json());

  // CORS
  // Handle preflight early and always include required headers.
  app.use((req, res, next) => {
    const origin = req.headers.origin;

    const allowedOrigins = new Set(
      [
        ...(process.env.FRONTEND_URL
          ? String(process.env.FRONTEND_URL)
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : []),
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3001'
      ].filter(Boolean)
    );

    const allowOrigin = origin && allowedOrigins.has(origin)
      ? origin
      : 'http://localhost:3000';

    res.setHeader('Access-Control-Allow-Origin', allowOrigin);
    res.setHeader('Vary', 'Origin');

    // If you need credentials, keep this true, otherwise set it to false/remove.
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET,POST,PUT,DELETE,OPTIONS'
    );

    // Echo back request headers if present; otherwise allow common ones.
    const reqAllowHeaders = req.headers['access-control-request-headers'];
    res.setHeader(
      'Access-Control-Allow-Headers',
      reqAllowHeaders || 'Content-Type, Authorization'
    );

    if (req.method === 'OPTIONS') {
      // Preflight: must respond with headers (and usually 204/200) immediately.
      return res.status(204).end();
    }

    next();
  });


  // Log requests for debugging endpoints / payload parsing.
  app.use((req, res, next) => {
    console.log(`[request] ${req.method} ${req.path}`);
    next();
  });


  app.get('/', (req, res) => {
    res.json({
      service: 'background-task-runner',
      queueDriver: driver,
      availableTaskTypes: listTaskTypes(),
      endpoints: [
        'GET /health',
        'POST /tasks',
        'GET /tasks',
        'GET /tasks/:id',
        'DELETE /tasks/:id'
      ]
    });
  });

  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      queueDriver: driver,
      time: new Date().toISOString()
    });
  });

  // Support both /tasks and /api/tasks to match different frontend deployments.
  const postTasksHandler = async (req, res, next) => {

    try {
      const task = await queue.add({
        type: req.body.type,
        payload: req.body.payload || {},
        runAt: req.body.runAt,
        delayMs: req.body.delayMs
      });

      res.status(201).json(task);
    } catch (error) {
      next(error);
    }
  };

  app.options('/tasks', (req, res) => res.status(204).end());
  app.options('/api/tasks', (req, res) => res.status(204).end());

  app.post('/tasks', validateTaskRequest, postTasksHandler);
  app.post('/api/tasks', validateTaskRequest, postTasksHandler);



  app.get('/tasks', async (req, res, next) => {
    try {
      res.json(await queue.list());
    } catch (error) {
      next(error);
    }
  });

  app.get('/tasks/:id', async (req, res, next) => {
    try {
      const task = await queue.get(req.params.id);

      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      res.json(task);
    } catch (error) {
      next(error);
    }
  });

  app.delete('/tasks/:id', async (req, res, next) => {
    try {
      const task = await queue.cancel(req.params.id);

      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      res.json(task);
    } catch (error) {
      next(error);
    }
  });

  app.use((error, req, res, next) => {
    console.error(error);
    res.status(500).json({ error: error.message });
  });

  const server = app.listen(PORT, () => {
    console.log(`Background task API running at http://localhost:${PORT}`);
    console.log(`Queue driver: ${driver}`);

    // Schedule daily reminders at 10:00am and 5:00pm.
    // Recipient: REMINDER_TO env var (fallback: rahu@gmail.com)
    const to = process.env.REMINDER_TO || 'rahu@gmail.com';
    const siteName = process.env.SITE_NAME || 'GeoBoard';
    const reminderMessage = process.env.REMINDER_MESSAGE || 'This is your scheduled reminder.';

    // Only schedule when tasks service is running. This works in both
    // Redis and in-memory modes.
    scheduleDailyReminder({
      queue,
      to,
      templateData: { siteName, name: process.env.REMINDER_NAME || 'there', message: reminderMessage },
      hour: 10,
      minute: 0
    });

    scheduleDailyReminder({
      queue,
      to,
      templateData: { siteName, name: process.env.REMINDER_NAME || 'there', message: reminderMessage },
      hour: 17,
      minute: 0
    });
  });


  async function shutdown() {
    console.log('Stopping background task service...');
    server.close(async () => {
      await queue.close();
      process.exit(0);
    });
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});