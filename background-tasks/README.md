# Background Task Runner

This service lets you queue work now or schedule it for a later time. It uses Redis + BullMQ when Redis is available and falls back to an in-memory scheduler for local testing.

## Start

```bash
npm run tasks
```

The API runs on `http://localhost:4000` by default.

## Queue a Task

Run after five seconds:

```bash
curl -X POST http://localhost:4000/tasks ^
  -H "Content-Type: application/json" ^
  -d "{\"type\":\"logMessage\",\"payload\":{\"text\":\"Run me later\"},\"delayMs\":5000}"
```

Run at a particular time:

```bash
curl -X POST http://localhost:4000/tasks ^
  -H "Content-Type: application/json" ^
  -d "{\"type\":\"sendEmail\",\"payload\":{\"to\":\"student@example.com\",\"subject\":\"Scheduled hello\"},\"runAt\":\"2026-06-04T16:30:00+05:30\"}"
```

## API

- `GET /health` checks whether the service is running.
- `GET /` shows available task types.
- `POST /tasks` queues a task.
- `GET /tasks` lists recent tasks.
- `GET /tasks/:id` fetches one task.
- `DELETE /tasks/:id` cancels a task if it has not started.

## Available Task Types

- `logMessage`
- `sendEmail`
- `generateReport`
- `cleanupUploads`

## Redis Mode

Install/start Redis, then run:

```bash
$env:REDIS_URL="redis://127.0.0.1:6379"
npm run tasks
```

To force Redis and fail if it is unavailable:

```bash
$env:TASK_QUEUE_DRIVER="redis"
npm run tasks
```

To force the local in-memory queue:

```bash
$env:TASK_QUEUE_DRIVER="memory"
npm run tasks
```
