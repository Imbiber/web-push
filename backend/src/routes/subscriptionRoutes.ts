import { Router } from 'express';
import subscriptionController from '../controllers/subscriptionController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public endpoints for SDK
router.post('/public/:apiKey/subscriptions', subscriptionController.subscribe.bind(subscriptionController));
router.delete('/public/:apiKey/subscriptions/:endpoint', subscriptionController.unsubscribe.bind(subscriptionController));
router.patch('/public/:apiKey/subscriptions/:id', subscriptionController.updateTags.bind(subscriptionController));

// Protected admin endpoints
router.get('/admin/:projectId/subscriptions', authenticate, subscriptionController.getSubscriptions.bind(subscriptionController));
router.get('/admin/:projectId/subscriptions/:id', authenticate, subscriptionController.getSubscription.bind(subscriptionController));

export default router;
