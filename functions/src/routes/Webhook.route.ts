import { Router } from 'express';
import express from 'express';
import * as CheckoutController from '../controllers/Checkout.controller';

const router = Router();

// Webhook needs raw body, so we use express.raw() middleware
router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  CheckoutController.handleStripeWebhook
);

export default router;