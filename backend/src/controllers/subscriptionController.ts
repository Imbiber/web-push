import { Request, Response, NextFunction } from 'express';
import subscriptionService from '../services/subscriptionService';
import projectService from '../services/projectService';
import { subscribeSchema, updateTagsSchema } from '../utils/validation';
import { AuthRequest } from '../types';

export class SubscriptionController {
  // Public endpoint for SDK
  async subscribe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { apiKey } = req.params;
      const { subscription, userAgent } = subscribeSchema.parse(req.body);

      const project = await projectService.getProjectByApiKey(apiKey);

      const result = await subscriptionService.subscribe(
        project.id,
        subscription,
        userAgent || req.headers['user-agent']
      );

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  // Public endpoint for SDK
  async unsubscribe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { endpoint } = req.params;

      const result = await subscriptionService.unsubscribe(decodeURIComponent(endpoint));

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // Public endpoint for SDK
  async updateTags(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { tags } = updateTagsSchema.parse(req.body);

      const result = await subscriptionService.updateTags(id, tags);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // Protected admin endpoint
  async getSubscriptions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { projectId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const filters: any = {};
      if (req.query.browserName) filters.browserName = req.query.browserName;
      if (req.query.osName) filters.osName = req.query.osName;
      if (req.query.deviceType) filters.deviceType = req.query.deviceType;
      if (req.query.isActive !== undefined) filters.isActive = req.query.isActive === 'true';

      const result = await subscriptionService.getSubscriptions(
        req.user.id,
        projectId,
        page,
        limit,
        filters
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // Protected admin endpoint
  async getSubscription(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { projectId, id } = req.params;

      const subscription = await subscriptionService.getSubscription(
        req.user.id,
        projectId,
        id
      );

      res.status(200).json(subscription);
    } catch (error) {
      next(error);
    }
  }
}

export default new SubscriptionController();
