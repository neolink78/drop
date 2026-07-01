import { scrapeProduct } from './Scraper.service';
import { mockScrapeProduct } from './MockScraper.service';
import * as AliExpress from './AliExpressApi.service';
import type { ProductData } from './Scraper.service';
import type { AliExpressSku } from './AliExpressApi.service';

export const getApiData = async (): Promise<{ message: string; timestamp: Date }> => {
  return {
    message: 'API is running successfully',
    timestamp: new Date()
  };
};

/**
 * Product data enriched with the SKU list required for order placement.
 */
export type EnrichedProductData = ProductData & { skus: AliExpressSku[] };

/**
 * Extract the numeric AliExpress product id from a product URL.
 */
export const extractProductId = (url: string): string => {
  const match = url.match(/\/item\/(\d+)\.html/);
  if (match && match[1]) return match[1];
  const altMatch = url.match(/(\d{10,})/);
  if (altMatch && altMatch[1]) return altMatch[1];
  throw new Error('Could not extract product ID from URL');
};

/**
 * Resolve product data from an AliExpress URL.
 *
 * Priority:
 *   1. Official AliExpress DS API (when configured + authorized)
 *   2. Mock scraper fallback (local dev without API keys)
 */
export const scrapeProductFromUrl = async (url: string): Promise<EnrichedProductData> => {
  if (!url || !url.includes('aliexpress')) {
    throw new Error('Invalid AliExpress URL provided');
  }

  const productId = extractProductId(url);

  if (AliExpress.isAliExpressConfigured()) {
    try {
      return await AliExpress.getProduct(productId, {
        shipToCountry: process.env.DEFAULT_SHIP_COUNTRY || 'FR',
        currency: process.env.DEFAULT_CURRENCY || 'EUR',
        language: process.env.DEFAULT_LANGUAGE || 'FR',
      });
    } catch (error) {
      console.error('AliExpress API fetch failed, falling back to mock:', error);
    }
  }

  // Fallback: mock scraper. Synthesize a single default SKU so downstream
  // order/checkout code has a consistent shape to work with.
  const mock = await mockScrapeProduct(url);
  const fallbackSku: AliExpressSku = {
    skuId: `${mock.aliexpressId}-default`,
    skuAttr: '',
    properties: 'Default',
    price: mock.price.current,
    originalPrice: mock.price.original,
    currency: mock.price.currency === '€' ? 'EUR' : mock.price.currency,
    stock: 999,
    image: mock.images[0],
  };

  return { ...mock, skus: [fallbackSku] };
};

/**
 * Legacy raw scraper entry point (Puppeteer). Kept for completeness but no
 * longer used in the main flow.
 */
export const legacyScrapeProduct = scrapeProduct;
