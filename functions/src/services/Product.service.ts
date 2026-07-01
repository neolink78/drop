import { PrismaClient, Product, Prisma } from '@prisma/client';
import { scrapeProductFromUrl } from './Api.service';
import type { ProductData } from './Scraper.service';

const prisma = new PrismaClient();

export interface CreateProductInput {
  aliexpressUrl: string;
  markupPercentage?: number;
}

export interface UpdateProductInput {
  markupPrice?: number;
  markupPercentage?: number;
}

/**
 * Calculate markup price based on original price and percentage
 */
const calculateMarkupPrice = (originalPrice: number, markupPercentage: number): number => {
  const markupAmount = originalPrice * (markupPercentage / 100);
  return Math.round((originalPrice + markupAmount) * 100) / 100; // Round to 2 decimal places
};

/**
 * Create a new product by scraping AliExpress URL
 */
export const createProduct = async (input: CreateProductInput): Promise<Product> => {
  try {
    // Scrape product data from AliExpress
    const scrapedData = await scrapeProductFromUrl(input.aliexpressUrl);
    
    // Calculate markup price
    const markupPercentage = input.markupPercentage || parseFloat(process.env.MARKUP_PERCENTAGE || '50');
    const markupPrice = calculateMarkupPrice(scrapedData.price.current, markupPercentage);
    
    // Check if product already exists
    const existingProduct = await prisma.product.findUnique({
      where: { aliexpressId: scrapedData.aliexpressId },
    });
    
    if (existingProduct) {
      // Update existing product with new scraped data
      return await prisma.product.update({
        where: { id: existingProduct.id },
        data: {
          title: scrapedData.title,
          description: scrapedData.description,
          originalPrice: scrapedData.price.current,
          markupPrice,
          images: scrapedData.images as unknown as Prisma.JsonArray,
          specifications: scrapedData.specs as unknown as Prisma.JsonObject,
          variants: scrapedData.variants as unknown as Prisma.JsonArray,
          skus: scrapedData.skus as unknown as Prisma.JsonArray,
          reviews: scrapedData.reviews as unknown as Prisma.JsonObject,
          shippingInfo: { text: scrapedData.shipping } as Prisma.JsonObject,
          sellerInfo: scrapedData.seller as unknown as Prisma.JsonObject,
          lastScraped: new Date(),
        },
      });
    }
    
    // Create new product
    const product = await prisma.product.create({
      data: {
        aliexpressUrl: input.aliexpressUrl,
        aliexpressId: scrapedData.aliexpressId,
        title: scrapedData.title,
        description: scrapedData.description,
        originalPrice: scrapedData.price.current,
        markupPrice,
        images: scrapedData.images as unknown as Prisma.JsonArray,
        specifications: scrapedData.specs as unknown as Prisma.JsonObject,
        variants: scrapedData.variants as unknown as Prisma.JsonArray,
        skus: scrapedData.skus as unknown as Prisma.JsonArray,
        reviews: scrapedData.reviews as unknown as Prisma.JsonObject,
        shippingInfo: { text: scrapedData.shipping } as Prisma.JsonObject,
        sellerInfo: scrapedData.seller as unknown as Prisma.JsonObject,
        lastScraped: new Date(),
      },
    });
    
    return product;
  } catch (error) {
    console.error('Error creating product:', error);
    throw new Error('Failed to create product');
  }
};

/**
 * Get all products
 */
export const getAllProducts = async (options?: {
  skip?: number;
  take?: number;
  orderBy?: Prisma.ProductOrderByWithRelationInput;
}): Promise<{ products: Product[]; total: number }> => {
  try {
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        skip: options?.skip || 0,
        take: options?.take || 20,
        orderBy: options?.orderBy || { createdAt: 'desc' },
      }),
      prisma.product.count(),
    ]);
    
    return { products, total };
  } catch (error) {
    console.error('Error fetching products:', error);
    throw new Error('Failed to fetch products');
  }
};

/**
 * Get a single product by ID
 */
export const getProductById = async (id: string): Promise<Product | null> => {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });
    
    return product;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw new Error('Failed to fetch product');
  }
};

/**
 * Update product markup price
 */
export const updateProductMarkup = async (
  id: string, 
  input: UpdateProductInput
): Promise<Product> => {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
    });
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    let markupPrice = input.markupPrice;
    
    // If markup percentage is provided, calculate the new price
    if (input.markupPercentage !== undefined) {
      markupPrice = calculateMarkupPrice(
        product.originalPrice.toNumber(), 
        input.markupPercentage
      );
    }
    
    if (markupPrice === undefined) {
      throw new Error('Either markupPrice or markupPercentage must be provided');
    }
    
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { markupPrice },
    });
    
    return updatedProduct;
  } catch (error) {
    console.error('Error updating product markup:', error);
    throw error;
  }
};

/**
 * Refresh product data from AliExpress
 */
export const refreshProductData = async (id: string): Promise<Product> => {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
    });
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    // Re-scrape product data
    const scrapedData = await scrapeProductFromUrl(product.aliexpressUrl);
    
    // Keep the same markup price unless the original price changed significantly
    let markupPrice = product.markupPrice.toNumber();
    const priceDifference = Math.abs(scrapedData.price.current - product.originalPrice.toNumber());
    const priceChangePercentage = (priceDifference / product.originalPrice.toNumber()) * 100;
    
    // If price changed by more than 10%, recalculate markup
    if (priceChangePercentage > 10) {
      const markupPercentage = parseFloat(process.env.MARKUP_PERCENTAGE || '50');
      markupPrice = calculateMarkupPrice(scrapedData.price.current, markupPercentage);
    }
    
    // Update product with new data
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        title: scrapedData.title,
        description: scrapedData.description,
        originalPrice: scrapedData.price.current,
        markupPrice,
        images: scrapedData.images as unknown as Prisma.JsonArray,
        specifications: scrapedData.specs as unknown as Prisma.JsonObject,
        variants: scrapedData.variants as unknown as Prisma.JsonArray,
        skus: scrapedData.skus as unknown as Prisma.JsonArray,
        reviews: scrapedData.reviews as unknown as Prisma.JsonObject,
        shippingInfo: { text: scrapedData.shipping } as Prisma.JsonObject,
        sellerInfo: scrapedData.seller as unknown as Prisma.JsonObject,
        lastScraped: new Date(),
      },
    });
    
    return updatedProduct;
  } catch (error) {
    console.error('Error refreshing product data:', error);
    throw new Error('Failed to refresh product data');
  }
};

/**
 * Delete a product
 */
export const deleteProduct = async (id: string): Promise<void> => {
  try {
    // Check if product has any orders
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        _count: {
          select: { orders: true },
        },
      },
    });
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    if (product._count.orders > 0) {
      throw new Error('Cannot delete product with existing orders');
    }
    
    await prisma.product.delete({
      where: { id },
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

/**
 * Get product analytics
 */
export const getProductAnalytics = async (id: string): Promise<{
  totalRevenue: number;
  totalOrders: number;
  totalProfit: number;
  conversionRate: number;
}> => {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        orders: {
          where: {
            orderStatus: {
              in: ['PAID', 'ORDERING', 'ORDERED', 'SHIPPED', 'DELIVERED'],
            },
          },
        },
      },
    });
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    const totalRevenue = product.orders.reduce(
      (sum, order) => sum + order.totalPaid.toNumber(), 
      0
    );
    const totalOrders = product.orders.length;
    const totalCost = product.orders.reduce(
      (sum, order) => sum + (product.originalPrice.toNumber() * order.quantity), 
      0
    );
    const totalProfit = totalRevenue - totalCost;
    
    // Note: Conversion rate would need page view tracking to be accurate
    const conversionRate = 0; // Placeholder
    
    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders,
      totalProfit: Math.round(totalProfit * 100) / 100,
      conversionRate,
    };
  } catch (error) {
    console.error('Error getting product analytics:', error);
    throw new Error('Failed to get product analytics');
  }
};