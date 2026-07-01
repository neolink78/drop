import { Router } from 'express';
import * as ProductController from '../controllers/Product.controller';

const router = Router();

// Public product routes (for customers)
router.get('/', ProductController.getAllProducts);
router.get('/:id', ProductController.getProductById);

export default router;