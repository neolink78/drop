import type { ProductData } from './Scraper.service';

/**
 * Mock scraper for testing without Puppeteer dependencies
 */
export const mockScrapeProduct = async (url: string): Promise<ProductData> => {
  // Simulate delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Extract ID from URL
  const match = url.match(/\/item\/(\d+)\.html/);
  const productId = match ? match[1] : '3256805868372779';
  
  return {
    aliexpressId: productId,
    title: 'For Mercedes Benz W212 W207 Carbon Fiber Modified RS Style Front Grill for E CLASS E200 E300 E350 2010-2013',
    price: {
      current: 6.69,
      original: 13.38,
      currency: '€',
      discount: 50
    },
    description: 'High-quality carbon fiber front grill for Mercedes Benz E-Class. Direct replacement, no modification needed. Enhances the sporty appearance of your vehicle.',
    images: [
      'https://ae01.alicdn.com/kf/S7e7b4e9a1b6c4a7db3c6e8f9a2b5d4f3Q/For-Mercedes-Benz-W212-W207-Carbon-Fiber-Modified-RS-Style-Front-Grill.jpg',
      'https://ae01.alicdn.com/kf/S8f9e0a1b2c3d4e5f6a7b8c9d0e1f2g3h/Front-view-carbon-fiber-grill.jpg',
      'https://ae01.alicdn.com/kf/S1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p/Installation-example.jpg'
    ],
    specs: {
      'Material': 'Carbon Fiber',
      'Color': 'Black',
      'Fitment': 'Mercedes Benz W212 W207 E200 E300 E350 2010-2013',
      'Installation': 'Direct Replacement',
      'Package': '1x Front Grill'
    },
    variants: [],
    seller: {
      name: 'AutoParts Store',
      rating: '98.5%',
      positiveFeeback: '98.5% positive feedback'
    },
    shipping: 'Free Shipping',
    reviews: {
      count: '245',
      rating: '4.8'
    },
    url: url
  };
};