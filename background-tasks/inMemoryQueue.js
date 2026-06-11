const { randomUUID } = require('crypto');

class InMemoryTaskQueue {
  constructor({ runTask }) {
    this.runTask = runTask;
    this.tasks = new Map();
    this.timers = new Map();
  }

  async add({ type, payload = {}, runAt, delayMs = 0 }) {
    const scheduledFor = runAt ? new Date(runAt) : new Date(Date.now() + Number(delayMs || 0));

    if (Number.isNaN(scheduledFor.getTime())) {
      throw new Error('runAt must be a valid date/time');
    }

    const task = {
      id: randomUUID(),
      type,
      payload,
      status: 'queued',
      result: null,
      error: null,
      createdAt: new Date().toISOString(),
      scheduledFor: scheduledFor.toISOString(),
      startedAt: null,
      finishedAt: null
    };

    this.tasks.set(task.id, task);
    this.schedule(task);

    return task;
  }

  get(id) {
    return this.tasks.get(id) || null;
  }

  list() {
    return Array.from(this.tasks.values()).sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  async cancel(id) {
    const task = this.tasks.get(id);

    if (!task) {
      return null;
    }

    if (!['queued', 'scheduled'].includes(task.status)) {
      throw new Error(`Cannot cancel a task with status "${task.status}"`);
    }

    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }

    task.status = 'cancelled';
    task.finishedAt = new Date().toISOString();

    return task;
  }

  schedule(task) {
    const delay = Math.max(0, new Date(task.scheduledFor).getTime() - Date.now());

    task.status = delay > 0 ? 'scheduled' : 'queued';

    const timer = setTimeout(() => this.execute(task.id), delay);
    this.timers.set(task.id, timer);
  }

  async execute(id) {
    const task = this.tasks.get(id);

    if (!task || task.status === 'cancelled') {
      return;
    }

    this.timers.delete(id);
    task.status = 'active';
    task.startedAt = new Date().toISOString();

    try {
      task.result = await this.runTask(task.type, task.payload);
      task.status = 'completed';
    } catch (error) {
      task.error = error?.message || String(error);
      task.status = 'failed';
      console.error(
        `[task:failed] ${task.type} (${task.id}) - ${task.error}`,
        error?.stack ? `\n${error.stack}` : ''
      );
    } finally {
      task.finishedAt = new Date().toISOString();
      if (task.status !== 'failed') {
        console.log(`[task:${task.status}] ${task.type} (${task.id})`);
      }
    }
  }

  async close() {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }

    this.timers.clear();
  }
}

module.exports = InMemoryTaskQueue;
