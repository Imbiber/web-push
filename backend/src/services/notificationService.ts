import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { NotificationPayload, TargetSegment } from '../types';
import { notificationQueue } from '../queue/notificationQueue';

export class NotificationService {
  async sendNotification(
    userId: string,
    projectId: string,
    payload: NotificationPayload,
    targetType: 'ALL' | 'SEGMENT' | 'INDIVIDUAL',
    targetSegment?: TargetSegment,
    scheduledAt?: Date
  ) {
    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
    });

    if (!project) {
      throw new AppError(404, 'Project not found');
    }

    // Find target subscriptions
    const subscriptions = await this.getTargetSubscriptions(
      projectId,
      targetType,
      targetSegment
    );

    if (subscriptions.length === 0) {
      throw new AppError(400, 'No subscriptions found for the specified target');
    }

    // Create notification record
    const notification = await prisma.notification.create({
      data: {
        title: payload.title,
        body: payload.body,
        icon: payload.icon,
        badge: payload.badge,
        image: payload.image,
        url: payload.url,
        targetType,
        targetSegment: targetSegment || {},
        projectId,
        totalTargeted: subscriptions.length,
        scheduledAt,
      },
    });

    // Create notification logs for tracking
    const logPromises = subscriptions.map((sub) =>
      prisma.notificationLog.create({
        data: {
          notificationId: notification.id,
          subscriptionId: sub.id,
        },
      })
    );

    await Promise.all(logPromises);

    // Queue notification jobs
    const delay = scheduledAt ? scheduledAt.getTime() - Date.now() : 0;

    const jobPromises = subscriptions.map((sub) =>
      notificationQueue.add(
        'send-notification',
        {
          notificationId: notification.id,
          projectId: project.id,
          payload,
          subscriptionId: sub.id,
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        {
          delay: delay > 0 ? delay : undefined,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        }
      )
    );

    await Promise.all(jobPromises);

    return {
      id: notification.id,
      totalTargeted: subscriptions.length,
      scheduledAt: notification.scheduledAt,
    };
  }

  private async getTargetSubscriptions(
    projectId: string,
    targetType: 'ALL' | 'SEGMENT' | 'INDIVIDUAL',
    targetSegment?: TargetSegment
  ) {
    const where: any = {
      projectId,
      isActive: true,
    };

    if (targetType === 'SEGMENT' && targetSegment) {
      if (targetSegment.browserName) {
        where.browserName = targetSegment.browserName;
      }
      if (targetSegment.browserVersion) {
        where.browserVersion = targetSegment.browserVersion;
      }
      if (targetSegment.osName) {
        where.osName = targetSegment.osName;
      }
      if (targetSegment.osVersion) {
        where.osVersion = targetSegment.osVersion;
      }
      if (targetSegment.deviceType) {
        where.deviceType = targetSegment.deviceType;
      }
      if (targetSegment.tags && Object.keys(targetSegment.tags).length > 0) {
        const tagQueries = Object.entries(targetSegment.tags).map(([key, value]) => ({
          tags: {
            some: {
              key,
              value,
            },
          },
        }));
        where.AND = tagQueries;
      }
    }

    if (targetType === 'INDIVIDUAL' && targetSegment?.subscriptionIds) {
      where.id = {
        in: targetSegment.subscriptionIds,
      };
    }

    return prisma.subscription.findMany({
      where,
      select: {
        id: true,
        endpoint: true,
        p256dh: true,
        auth: true,
      },
    });
  }

  async getNotifications(
    userId: string,
    projectId: string,
    page = 1,
    limit = 50
  ) {
    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
    });

    if (!project) {
      throw new AppError(404, 'Project not found');
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { projectId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where: { projectId } }),
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getNotification(userId: string, projectId: string, notificationId: string) {
    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
    });

    if (!project) {
      throw new AppError(404, 'Project not found');
    }

    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        projectId,
      },
    });

    if (!notification) {
      throw new AppError(404, 'Notification not found');
    }

    return notification;
  }

  async getNotificationStats(
    userId: string,
    projectId: string,
    notificationId: string
  ) {
    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
    });

    if (!project) {
      throw new AppError(404, 'Project not found');
    }

    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        projectId,
      },
      include: {
        logs: true,
      },
    });

    if (!notification) {
      throw new AppError(404, 'Notification not found');
    }

    return {
      id: notification.id,
      title: notification.title,
      totalTargeted: notification.totalTargeted,
      totalSent: notification.totalSent,
      totalDelivered: notification.totalDelivered,
      totalClicked: notification.totalClicked,
      totalFailed: notification.totalFailed,
      status: notification.status,
      createdAt: notification.createdAt,
      sentAt: notification.sentAt,
    };
  }

  async getAnalytics(userId: string, projectId: string) {
    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
    });

    if (!project) {
      throw new AppError(404, 'Project not found');
    }

    const [
      totalNotifications,
      totalSubscriptions,
      activeSubscriptions,
      recentNotifications,
    ] = await Promise.all([
      prisma.notification.count({ where: { projectId } }),
      prisma.subscription.count({ where: { projectId } }),
      prisma.subscription.count({ where: { projectId, isActive: true } }),
      prisma.notification.findMany({
        where: { projectId },
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          totalTargeted: true,
          totalSent: true,
          totalDelivered: true,
          totalClicked: true,
          totalFailed: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      totalNotifications,
      totalSubscriptions,
      activeSubscriptions,
      recentNotifications,
    };
  }

  async trackDelivery(notificationId: string, subscriptionId: string, event: 'delivered' | 'clicked') {
    const log = await prisma.notificationLog.findFirst({
      where: {
        notificationId,
        subscriptionId,
      },
    });

    if (!log) {
      throw new AppError(404, 'Notification log not found');
    }

    const updateData: any = {};

    if (event === 'delivered') {
      updateData.status = 'DELIVERED';
      updateData.deliveredAt = new Date();
    } else if (event === 'clicked') {
      updateData.status = 'CLICKED';
      updateData.clickedAt = new Date();
      if (!log.deliveredAt) {
        updateData.deliveredAt = new Date();
      }
    }

    await prisma.notificationLog.update({
      where: { id: log.id },
      data: updateData,
    });

    // Update notification stats
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      include: {
        logs: true,
      },
    });

    if (notification) {
      const stats = {
        totalDelivered: notification.logs.filter((l) =>
          ['DELIVERED', 'CLICKED'].includes(l.status)
        ).length,
        totalClicked: notification.logs.filter((l) => l.status === 'CLICKED').length,
      };

      await prisma.notification.update({
        where: { id: notificationId },
        data: stats,
      });
    }

    return { message: 'Delivery tracked successfully' };
  }
}

export default new NotificationService();
