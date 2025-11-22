import { Worker, Job } from 'bullmq';
import webpush from 'web-push';
import prisma from '../config/database';
import redis from '../config/redis';
import { NotificationJobData } from '../types';

const worker = new Worker(
  'notification-queue',
  async (job: Job<NotificationJobData>) => {
    const { notificationId, projectId, payload, subscriptionId, endpoint, keys } = job.data;

    try {
      // Get project VAPID keys
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new Error('Project not found');
      }

      // Configure web-push
      webpush.setVapidDetails(
        `mailto:${project.vapidEmail}`,
        project.vapidPublicKey,
        project.vapidPrivateKey
      );

      // Create push subscription object
      const pushSubscription = {
        endpoint,
        keys,
      };

      // Send the notification
      const notificationPayload = JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon,
        badge: payload.badge,
        image: payload.image,
        url: payload.url,
        notificationId,
        subscriptionId,
      });

      await webpush.sendNotification(pushSubscription, notificationPayload);

      // Update notification log
      await prisma.notificationLog.updateMany({
        where: {
          notificationId,
          subscriptionId,
        },
        data: {
          status: 'SENT',
        },
      });

      // Update notification stats
      await updateNotificationStats(notificationId);

      console.log(`✅ Notification sent successfully: ${notificationId} -> ${subscriptionId}`);
    } catch (error: any) {
      console.error(`❌ Failed to send notification: ${error.message}`);

      // Handle 410 Gone - subscription expired
      if (error.statusCode === 410) {
        await prisma.subscription.update({
          where: { endpoint },
          data: { isActive: false },
        });

        await prisma.notificationLog.updateMany({
          where: {
            notificationId,
            subscriptionId,
          },
          data: {
            status: 'FAILED',
            error: 'Subscription expired (410)',
          },
        });
      } else {
        // Update notification log with error
        await prisma.notificationLog.updateMany({
          where: {
            notificationId,
            subscriptionId,
          },
          data: {
            status: 'FAILED',
            error: error.message,
          },
        });
      }

      // Update notification stats
      await updateNotificationStats(notificationId);

      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 5,
  }
);

async function updateNotificationStats(notificationId: string) {
  const logs = await prisma.notificationLog.findMany({
    where: { notificationId },
  });

  const stats = {
    totalSent: logs.filter((l) => ['SENT', 'DELIVERED', 'CLICKED'].includes(l.status)).length,
    totalDelivered: logs.filter((l) => ['DELIVERED', 'CLICKED'].includes(l.status)).length,
    totalClicked: logs.filter((l) => l.status === 'CLICKED').length,
    totalFailed: logs.filter((l) => l.status === 'FAILED').length,
  };

  // Determine overall status
  let status = 'SENDING';
  const totalProcessed = stats.totalSent + stats.totalFailed;
  const totalTargeted = logs.length;

  if (totalProcessed >= totalTargeted) {
    status = stats.totalSent > 0 ? 'SENT' : 'FAILED';
  }

  await prisma.notification.update({
    where: { id: notificationId },
    data: {
      ...stats,
      status,
      sentAt: status === 'SENT' ? new Date() : undefined,
    },
  });
}

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.log(`Job ${job?.id} failed with error: ${err.message}`);
});

worker.on('error', (err) => {
  console.error('Worker error:', err);
});

console.log('🚀 Notification worker started');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing worker...');
  await worker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing worker...');
  await worker.close();
  process.exit(0);
});
