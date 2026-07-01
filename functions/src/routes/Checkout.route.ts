import { Router } from 'express';
import * as CheckoutController from '../controllers/Checkout.controller';

const router = Router();

// Checkout routes
router.post('/session', CheckoutController.createCheckoutSession);
router.post('/payment-link', CheckoutController.createPaymentLink);

export default router;