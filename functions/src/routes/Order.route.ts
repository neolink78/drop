import { Router } from 'express';
import * as OrderController from '../controllers/Order.controller';

const router = Router();

// Order routes
router.post('/', OrderController.createOrder);
router.get('/', OrderController.getAllOrders);
router.get('/statistics', OrderController.getOrderStatistics);
router.get('/:id', OrderController.getOrderById);
router.put('/:id/status', OrderController.updateOrderStatus);
router.post('/:id/fulfill', OrderController.fulfillOrder);
router.post('/:id/tracking/refresh', OrderController.refreshTracking);
router.post('/:id/refund', OrderController.refundOrder);

export default router;