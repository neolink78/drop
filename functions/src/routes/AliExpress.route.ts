import { Router } from 'express';
import * as AliExpressController from '../controllers/AliExpress.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Initiating authorization and reading status require admin auth.
router.get('/authorize', authenticate, AliExpressController.authorize);
router.get('/status', authenticate, AliExpressController.status);
router.get('/address-tree', authenticate, AliExpressController.addressTree);

// The OAuth callback is hit by the browser redirect from AliExpress and cannot
// carry our JWT, so it stays public.
router.get('/callback', AliExpressController.callback);

export default router;
