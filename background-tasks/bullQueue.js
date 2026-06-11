const { Queue, Worker, QueueEvents } = require('bullmq');

const QUEUE_NAME = 'background-tasks';

function normalizeJob(job) {
  if (!job) {
    return null;
  }

  return {
    id: job.id,
    type: job.name,
    payload: job.data || {},
    status: null,
    result: job.returnvalue || null,
    error: job.failedReason || null,
    createdAt: job.timestamp ? new Date(job.timestamp).toISOString() : null,
    scheduledFor: new Date(job.timestamp + (job.opts.delay || 0)).toISOString(),
    attemptsMade: job.attemptsMade
  };
}

class BullTaskQueue {
  constructor({ connection, runTask }) {
    this.queue = new Queue(QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000
        },
        removeOnComplete: false,
        removeOnFail: false
      }
    });

    this.worker = new Worker(
      QUEUE_NAME,
      async (job) => runTask(job.name, job.data),
      { connection }
    );

    this.events = new QueueEvents(QUEUE_NAME, { connection });

    this.worker.on('completed', (job) => {
      console.log(`[task:completed] ${job.name} (${job.id})`);
    });

    this.worker.on('failed', (job, error) => {
      console.error(`[task:failed] ${job?.name} (${job?.id}): ${error.message}`);
    });

    // Also prevent unhandled error events from taking down the process.
    if (this.queue?.events) {
      this.queue.events?.on('error', () => {});
    }

  }

  async add({ type, payload = {}, runAt, delayMs = 0 }) {
    const delay = runAt
      ? Math.max(0, new Date(runAt).getTime() - Date.now())
      : Math.max(0, Number(delayMs || 0));

    if (Number.isNaN(delay)) {
      throw new Error('runAt must be a valid date/time');
    }

    const job = await this.queue.add(type, payload, { delay });

    return {
      ...normalizeJob(job),
      status: delay > 0 ? 'scheduled' : 'queued'
    };
  }

  async get(id) {
    const job = await this.queue.getJob(id);
    const task = normalizeJob(job);

    if (!task || !job) {
      return null;
    }

    task.status = await job.getState();
    return task;
  }

  async list() {
    const jobs = await this.queue.getJobs(
      ['waiting', 'delayed', 'active', 'completed', 'failed'],
      0,
      100,
      true
    );

    return Promise.all(
      jobs.map(async (job) => {
        const task = normalizeJob(job);
        task.status = await job.getState();
        return task;
      })
    );
  }

  async cancel(id) {
    const job = await this.queue.getJob(id);

    if (!job) {
      return null;
    }

    const state = await job.getState();

    if (!['waiting', 'delayed'].includes(state)) {
      throw new Error(`Cannot cancel a task with status "${state}"`);
    }

    await job.remove();

    return {
      ...normalizeJob(job),
      status: 'cancelled'
    };
  }

  async close() {
    await Promise.all([
      this.worker.close(),
      this.events.close(),
      this.queue.close()
    ]);
  }
}

module.exports = BullTaskQueue;
