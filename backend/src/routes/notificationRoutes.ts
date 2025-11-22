import { Router } from 'express';
import notificationController from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Protected endpoints
router.post('/:projectId/notifications/send', authenticate, notificationController.sendNotification.bind(notificationController));
router.get('/:projectId/notifications', authenticate, notificationController.getNotifications.bind(notificationController));
router.get('/:projectId/notifications/:id', authenticate, notificationController.getNotification.bind(notificationController));
router.get('/:projectId/notifications/:id/stats', authenticate, notificationController.getNotificationStats.bind(notificationController));
router.get('/:projectId/analytics', authenticate, notificationController.getAnalytics.bind(notificationController));

export default router;
