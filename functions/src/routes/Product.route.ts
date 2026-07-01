import { Router } from 'express';
import * as ProductController from '../controllers/Product.controller';

const router = Router();

// Product routes
router.post('/', ProductController.createProduct);
router.get('/', ProductController.getAllProducts);
router.get('/:id', ProductController.getProductById);
router.put('/:id/markup', ProductController.updateProductMarkup);
router.post('/:id/refresh', ProductController.refreshProductData);
router.delete('/:id', ProductController.deleteProduct);
router.get('/:id/analytics', ProductController.getProductAnalytics);

export default router;