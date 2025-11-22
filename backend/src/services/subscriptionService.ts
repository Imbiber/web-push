import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { parseBrowserInfo } from '../utils/parser';
import { PushSubscription } from '../types';

export class SubscriptionService {
  async subscribe(
    projectId: string,
    subscription: PushSubscription,
    userAgent?: string
  ) {
    const browserInfo = userAgent ? parseBrowserInfo(userAgent) : {
      browserName: null,
      browserVersion: null,
      osName: null,
      osVersion: null,
      deviceType: null,
    };

    // Check if subscription already exists
    const existing = await prisma.subscription.findUnique({
      where: { endpoint: subscription.endpoint },
    });

    if (existing) {
      // Update existing subscription
      const updated = await prisma.subscription.update({
        where: { endpoint: subscription.endpoint },
        data: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          isActive: true,
          ...browserInfo,
        },
        select: {
          id: true,
          endpoint: true,
          createdAt: true,
        },
      });

      return updated;
    }

    // Create new subscription
    const newSubscription = await prisma.subscription.create({
      data: {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        projectId,
        ...browserInfo,
      },
      select: {
        id: true,
        endpoint: true,
        createdAt: true,
      },
    });

    return newSubscription;
  }

  async unsubscribe(endpoint: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { endpoint },
    });

    if (!subscription) {
      throw new AppError(404, 'Subscription not found');
    }

    await prisma.subscription.update({
      where: { endpoint },
      data: { isActive: false },
    });

    return { message: 'Unsubscribed successfully' };
  }

  async updateTags(subscriptionId: string, tags: Record<string, string>) {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new AppError(404, 'Subscription not found');
    }

    // Delete existing tags
    await prisma.subscriptionTag.deleteMany({
      where: { subscriptionId },
    });

    // Create new tags
    const tagPromises = Object.entries(tags).map(([key, value]) =>
      prisma.subscriptionTag.create({
        data: {
          subscriptionId,
          key,
          value,
        },
      })
    );

    await Promise.all(tagPromises);

    return { message: 'Tags updated successfully' };
  }

  async getSubscriptions(
    userId: string,
    projectId: string,
    page = 1,
    limit = 50,
    filters?: {
      browserName?: string;
      osName?: string;
      deviceType?: string;
      isActive?: boolean;
    }
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

    const where: any = { projectId };

    if (filters?.browserName) {
      where.browserName = filters.browserName;
    }
    if (filters?.osName) {
      where.osName = filters.osName;
    }
    if (filters?.deviceType) {
      where.deviceType = filters.deviceType;
    }
    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        include: {
          tags: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.subscription.count({ where }),
    ]);

    return {
      subscriptions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSubscription(userId: string, projectId: string, subscriptionId: string) {
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

    const subscription = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        projectId,
      },
      include: {
        tags: true,
      },
    });

    if (!subscription) {
      throw new AppError(404, 'Subscription not found');
    }

    return subscription;
  }
}

export default new SubscriptionService();
