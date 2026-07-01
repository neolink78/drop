import { Request, Response } from 'express';
import * as ProductService from '../services/Product.service';

export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { aliexpressUrl, markupPercentage } = req.body;
    
    if (!aliexpressUrl) {
      res.status(400).json({ error: 'AliExpress URL is required' });
      return;
    }
    
    const product = await ProductService.createProduct({
      aliexpressUrl,
      markupPercentage,
    });
    
    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('Error in createProduct controller:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create product',
    });
  }
};

export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '20', sortBy = 'createdAt', order = 'desc' } = req.query;
    
    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const skip = (pageNumber - 1) * limitNumber;
    
    const { products, total } = await ProductService.getAllProducts({
      skip,
      take: limitNumber,
      orderBy: { [sortBy as string]: order },
    });
    
    res.json({
      success: true,
      data: products,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error) {
    console.error('Error in getAllProducts controller:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch products',
    });
  }
};

export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const product = await ProductService.getProductById(id);
    
    if (!product) {
      res.status(404).json({
        success: false,
        error: 'Product not found',
      });
      return;
    }
    
    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('Error in getProductById controller:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch product',
    });
  }
};

export const updateProductMarkup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { markupPrice, markupPercentage } = req.body;
    
    if (markupPrice === undefined && markupPercentage === undefined) {
      res.status(400).json({
        success: false,
        error: 'Either markupPrice or markupPercentage is required',
      });
      return;
    }
    
    const product = await ProductService.updateProductMarkup(id, {
      markupPrice,
      markupPercentage,
    });
    
    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('Error in updateProductMarkup controller:', error);
    const statusCode = error instanceof Error && error.message === 'Product not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update product markup',
    });
  }
};

export const refreshProductData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const product = await ProductService.refreshProductData(id);
    
    res.json({
      success: true,
      data: product,
      message: 'Product data refreshed successfully',
    });
  } catch (error) {
    console.error('Error in refreshProductData controller:', error);
    const statusCode = error instanceof Error && error.message === 'Product not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to refresh product data',
    });
  }
};

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    await ProductService.deleteProduct(id);
    
    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Error in deleteProduct controller:', error);
    const statusCode = 
      error instanceof Error && error.message === 'Product not found' ? 404 :
      error instanceof Error && error.message.includes('existing orders') ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete product',
    });
  }
};

export const getProductAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const analytics = await ProductService.getProductAnalytics(id);
    
    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('Error in getProductAnalytics controller:', error);
    const statusCode = error instanceof Error && error.message === 'Product not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch product analytics',
    });
  }
};