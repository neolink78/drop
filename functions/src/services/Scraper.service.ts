import puppeteer, { Browser, Page } from 'puppeteer';
import { writeFileSync } from 'fs';
import path from 'path';

// Define types for our data structures
export type SellerInfo = {
  readonly name: string;
  readonly rating: string;
  readonly positiveFeeback: string;
};

export type Reviews = {
  readonly count: string;
  readonly rating: string;
};

export type PriceInfo = {
  readonly current: number;
  readonly original: number;
  readonly currency: string;
  readonly discount: number;
};

export type Variant = {
  readonly id: string;
  readonly name: string;
  readonly price?: number;
  readonly image?: string;
  readonly stock?: number;
};

export type ProductData = {
  readonly aliexpressId: string;
  readonly title: string;
  readonly price: PriceInfo;
  readonly description: string;
  readonly images: readonly string[];
  readonly specs: Readonly<Record<string, string>>;
  readonly variants: readonly Variant[];
  readonly seller: SellerInfo;
  readonly shipping: string;
  readonly reviews: Reviews;
  readonly url: string;
};

// Global browser instance (could be improved with a more functional approach like a browser pool)
let browserInstance: Browser | null = null;

/**
 * Initialize a browser instance if it doesn't exist
 */
const initBrowser = async (): Promise<Browser> => {
  if (!browserInstance) {
    browserInstance = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });
  }
  return browserInstance;
};

/**
 * Close the browser instance if it exists
 */
const closeBrowser = async (): Promise<void> => {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
    console.log('Browser closed');
  }
};

/**
 * Create a page with the appropriate configurations
 */
const createPage = async (): Promise<Page> => {
  const browser = await initBrowser();
  const page = await browser.newPage();
  
  // Configure the page
  await page.setViewport({ width: 1280, height: 800 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
  
  return page;
};

/**
 * Extract AliExpress product ID from URL
 */
const extractProductId = (url: string): string => {
  // Match patterns like /item/3256805868372779.html or /item/1005003456789012.html
  const match = url.match(/\/item\/(\d+)\.html/);
  if (match && match[1]) {
    return match[1];
  }
  // Try alternative pattern for different URL formats
  const altMatch = url.match(/product\/(\d+)/);
  if (altMatch && altMatch[1]) {
    return altMatch[1];
  }
  throw new Error('Could not extract product ID from URL');
};

/**
 * Parse price string to extract numeric value and currency
 */
const parsePrice = (priceString: string): { value: number; currency: string } => {
  // Remove all non-numeric characters except decimal point and comma
  const cleanPrice = priceString.replace(/[^\d.,]/g, '');
  
  // Handle different decimal separators
  const normalizedPrice = cleanPrice.replace(',', '.');
  const value = parseFloat(normalizedPrice) || 0;
  
  // Extract currency symbol
  const currencyMatch = priceString.match(/[€$£¥₹]/);
  const currency = currencyMatch ? currencyMatch[0] : 'USD';
  
  return { value, currency };
};

/**
 * Extract product data from the loaded page
 */
const extractProductData = async (page: Page, url: string): Promise<ProductData> => {
  const aliexpressId = extractProductId(url);
  
  return page.evaluate((productId: string, pageUrl: string) => {
    const getTextContent = (selectors: string | string[], defaultValue: string = 'Not available'): string => {
      const selectorArray = Array.isArray(selectors) ? selectors : [selectors];
      
      for (const selector of selectorArray) {
        const element = document.querySelector(selector);
        if (element && element.textContent) {
          return element.textContent.trim();
        }
      }
      return defaultValue;
    };
    
    const getImages = (): readonly string[] => {
      const images: string[] = [];
      // Try multiple possible selectors
      const selectors = [
        '.images-view-item img',
        '.image-view-magnifier-wrap img',
        '.magnifier-image img',
        '.slider-image-wrapper img'
      ];
      
      selectors.forEach(selector => {
        const imageElements = document.querySelectorAll(selector);
        imageElements.forEach((img: Element) => {
          const imgElement = img as HTMLImageElement;
          if (imgElement.src && !images.includes(imgElement.src)) {
            images.push(imgElement.src);
          }
        });
      });
      
      return images.length > 0 ? images : ['No images found'];
    };
    
    const getSpecs = (): Readonly<Record<string, string>> => {
      const specs: Record<string, string> = {};
      const specSelectors = [
        '.specification-keys',
        '.product-specs-item',
        '.property-item'
      ];
      
      specSelectors.forEach(selector => {
        const specElements = document.querySelectorAll(selector);
        specElements.forEach((spec: Element) => {
          const key = spec.querySelector('.colon-left, .property-title')?.textContent?.trim();
          const value = spec.querySelector('.colon-right, .property-value')?.textContent?.trim();
          if (key && value) specs[key] = value;
        });
      });
      
      return specs;
    };
    
    const getVariants = (): readonly Variant[] => {
      const variants: Variant[] = [];
      const variantContainers = document.querySelectorAll('.sku-property');
      
      variantContainers.forEach((container) => {
        const propertyTitle = container.querySelector('.sku-title')?.textContent?.trim() || '';
        const variantElements = container.querySelectorAll('.sku-property-item');
        
        variantElements.forEach((variant: Element, index: number) => {
          const variantElement = variant as HTMLElement;
          const variantText = variantElement.textContent?.trim() || '';
          const variantImage = variantElement.querySelector('img')?.src;
          
          variants.push({
            id: `${propertyTitle}-${index}`,
            name: `${propertyTitle}: ${variantText}`,
            image: variantImage
          });
        });
      });
      
      return variants;
    };
    
    const getPriceInfo = (): PriceInfo => {
      // Try multiple price selectors
      const currentPriceSelectors = [
        '.uniform-banner-box-price',
        '.product-price-current',
        '.product-price-value',
        '[data-spm-anchor-id*="price"]'
      ];
      
      const originalPriceSelectors = [
        '.uniform-banner-box-discounts',
        '.product-price-original',
        '.origin-price'
      ];
      
      const currentPriceText = getTextContent(currentPriceSelectors, '0');
      const originalPriceText = getTextContent(originalPriceSelectors, currentPriceText);
      
      // Parse prices
      const parsePrice = (priceText: string) => {
        const cleanPrice = priceText.replace(/[^\d.,]/g, '');
        const normalizedPrice = cleanPrice.replace(',', '.');
        return parseFloat(normalizedPrice) || 0;
      };
      
      const currentPrice = parsePrice(currentPriceText);
      const originalPrice = parsePrice(originalPriceText);
      
      // Extract currency
      const currencyMatch = currentPriceText.match(/[€$£¥₹]/);
      const currency = currencyMatch ? currencyMatch[0] : 'USD';
      
      // Calculate discount
      const discount = originalPrice > currentPrice 
        ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
        : 0;
      
      return {
        current: currentPrice,
        original: originalPrice,
        currency: currency,
        discount: discount
      };
    };
    
    const getSellerInfo = (): SellerInfo => ({
      name: getTextContent(['.shop-name', '.store-name', '.seller-name'], 'Seller name not available'),
      rating: getTextContent(['.percent-num', '.positive-rate'], 'Rating not available'),
      positiveFeeback: getTextContent(['.positive-percent', '.positive-feedback'], 'Feedback not available')
    });
    
    return {
      aliexpressId: productId,
      title: getTextContent(['.product-title', '.product-title-text', 'h1'], 'Product title not found'),
      price: getPriceInfo(),
      description: getTextContent(['.detail-desc-decorate-richtext', '.product-description', '.description-content'], 'Description not available'),
      images: getImages(),
      specs: getSpecs(),
      variants: getVariants(),
      seller: getSellerInfo(),
      shipping: getTextContent(['.product-shipping-price', '.shipping-cost', '.logistics-cost'], 'Shipping info not available'),
      reviews: {
        count: getTextContent(['.product-reviewer-reviews', '.review-count', '.feedback-count'], '0'),
        rating: getTextContent(['.overview-rating-average', '.avg-rating', '.rating-value'], 'N/A')
      },
      url: pageUrl
    };
  }, aliexpressId, url);
};

/**
 * Navigate to page and wait for content to load
 */
const navigateToProductPage = async (page: Page, url: string): Promise<void> => {
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('.product-title', { timeout: 10000 })
    .catch(() => console.log('Title selector not found'));
};

/**
 * Save product data to a JSON file
 */
const saveProductData = (productData: ProductData): void => {
  const filePath = path.join(__dirname, 'aliexpress-product-data.json');
  writeFileSync(filePath, JSON.stringify(productData, null, 2));
  console.log(`Data saved to ${filePath}`);
};

/**
 * Main scraping function that composes other functions
 */
export const scrapeProduct = async (url: string): Promise<ProductData> => {
  console.log(`Starting to scrape: ${url}`);
  const page = await createPage();
  
  try {
    // Navigate and wait for content
    console.log('Navigating to the product page...');
    await navigateToProductPage(page, url);
    
    // Wait for price to load
    await page.waitForSelector('.uniform-banner-box-price, .product-price-current, .product-price-value', { 
      timeout: 15000 
    }).catch(() => console.log('Price selector not found, continuing anyway'));
    
    // Extract the data
    console.log('Extracting product data...');
    const productData = await extractProductData(page, url);
    
    console.log('Product data extracted successfully');
    console.log(`Product ID: ${productData.aliexpressId}`);
    console.log(`Price: ${productData.price.currency}${productData.price.current}`);
    
    return productData;
  } catch (error) {
    console.error('An error occurred during scraping:', error);
    throw error;
  } finally {
    await page.close();
  }
};

/**
 * Export function to close browser when needed
 */
export const cleanupScraper = async (): Promise<void> => {
  await closeBrowser();
};