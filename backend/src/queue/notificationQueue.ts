import { Queue } from 'bullmq';
import redis from '../config/redis';

export const notificationQueue = new Queue('notification-queue', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      count: 100,
      age: 24 * 3600, // 24 hours
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // 7 days
    },
  },
});

export default notificationQueue;
