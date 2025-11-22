import { Request, Response, NextFunction } from 'express';
import notificationService from '../services/notificationService';
import { sendNotificationSchema, deliveryWebhookSchema } from '../utils/validation';
import { AuthRequest } from '../types';

export class NotificationController {
  async sendNotification(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { projectId } = req.params;
      const data = sendNotificationSchema.parse(req.body);

      const payload = {
        title: data.title,
        body: data.body,
        icon: data.icon,
        badge: data.badge,
        image: data.image,
        url: data.url,
      };

      const scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : undefined;

      const result = await notificationService.sendNotification(
        req.user.id,
        projectId,
        payload,
        data.targetType,
        data.targetSegment,
        scheduledAt
      );

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getNotifications(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { projectId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const result = await notificationService.getNotifications(
        req.user.id,
        projectId,
        page,
        limit
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getNotification(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { projectId, id } = req.params;

      const notification = await notificationService.getNotification(
        req.user.id,
        projectId,
        id
      );

      res.status(200).json(notification);
    } catch (error) {
      next(error);
    }
  }

  async getNotificationStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { projectId, id } = req.params;

      const stats = await notificationService.getNotificationStats(
        req.user.id,
        projectId,
        id
      );

      res.status(200).json(stats);
    } catch (error) {
      next(error);
    }
  }

  async getAnalytics(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { projectId } = req.params;

      const analytics = await notificationService.getAnalytics(req.user.id, projectId);

      res.status(200).json(analytics);
    } catch (error) {
      next(error);
    }
  }

  async trackDelivery(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { notificationId, subscriptionId, event } = deliveryWebhookSchema.parse(req.body);

      const result = await notificationService.trackDelivery(
        notificationId,
        subscriptionId,
        event
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default new NotificationController();
