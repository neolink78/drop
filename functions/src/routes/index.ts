import { Router } from "express";
import ApiRouter from "./Api.route";
import productRouter from './Product.route';
import publicProductRouter from './PublicProduct.route';
import publicOrderRouter from './PublicOrder.route';
import checkoutRouter from './Checkout.route';
import webhookRouter from './Webhook.route';
import orderRouter from './Order.route';
import authRouter from './Auth.route';
import aliexpressRouter from './AliExpress.route';
import { authenticate } from '../middleware/auth.middleware';

const router: Router = Router()

// Public routes
router.use('/api', ApiRouter)
router.use('/api/auth', authRouter)
router.use('/webhook', webhookRouter)
router.use('/api/checkout', checkoutRouter) // Checkout is public for customers
router.use('/api/public/products', publicProductRouter) // Public product endpoints
router.use('/api/public/orders', publicOrderRouter) // Public order tracking
router.use('/api/admin/aliexpress', aliexpressRouter) // AliExpress OAuth (auth handled per-route)

// Protected admin routes
router.use('/api/admin/products', authenticate, productRouter) // Admin product management
router.use('/api/admin/orders', authenticate, orderRouter) // Admin order management

export default router