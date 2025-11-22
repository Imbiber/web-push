import { Router } from 'express';
import notificationController from '../controllers/notificationController';

const router = Router();

// Public webhook endpoint
router.post('/delivery', notificationController.trackDelivery.bind(notificationController));

export default router;
