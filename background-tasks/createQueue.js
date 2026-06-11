const Redis = require('ioredis');
const BullTaskQueue = require('./bullQueue');
const InMemoryTaskQueue = require('./inMemoryQueue');

async function createQueue({ runTask }) {
  // ✅ FIXED: Force memory mode - no Redis needed
  const driver = 'memory';

  if (driver === 'memory') {
    return {
      driver: 'memory',
      queue: new InMemoryTaskQueue({ runTask })
    };
  }

  // Upstash Redis URL format: redis://default:TOKEN@host:port
  const redisUrl = process.env.REDIS_URL || 'rediss://default:AaYUAAIgcDFmZWI5ODQ1NzBlNTI0OTFjYjg1NDYyZjJlMmI1ZDY0Yw@powerful-shrew-42516.upstash.io:6379';
  const connection = new Redis(redisUrl, {
    tls: {
      rejectUnauthorized: false
    },
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    connectTimeout: 10000,
    retryStrategy: (times) => {
      if (times > 3) return null;
      return Math.min(times * 200, 2000);
    }
  });

  connection.on('error', (err) => {
    console.error('Redis connection error:', err.message);
  });

  try {
    await connection.ping();

    return {
      driver: 'redis',
      queue: new BullTaskQueue({ connection, runTask })
    };
  } catch (error) {
    await connection.quit().catch(() => {});

    if (driver === 'redis') {
      throw new Error(`Redis task queue requested but unavailable: ${error.message}`);
    }

    console.warn('Redis unavailable, using in-memory background task queue.');

    return {
      driver: 'memory',
      queue: new InMemoryTaskQueue({ runTask })
    };
  }
}

module.exports = createQueue;