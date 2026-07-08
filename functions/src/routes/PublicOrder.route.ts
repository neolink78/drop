import { Router } from 'express';
import * as OrderController from '../controllers/Order.controller';

const router = Router();

// Public order tracking: /api/public/orders/status?order=...&email=...
router.get('/status', OrderController.getPublicOrderStatus);

export default router;
