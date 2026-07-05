import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import type {
  ProductData,
  PriceInfo,
  Variant,
  SellerInfo,
  Reviews,
} from './Scraper.service';

const prisma = new PrismaClient();

/**
 * AliExpress Open Platform (TOP) gateway. The System Interface (SG) endpoint is
 * used for oversea dropshipping developers.
 */
const GATEWAY_URL = process.env.ALIEXPRESS_GATEWAY_URL || 'https://api-sg.aliexpress.com/sync';
const AUTH_URL = 'https://api-sg.aliexpress.com/oauth/authorize';
const TOKEN_URL = 'https://api-sg.aliexpress.com/rest';

const APP_KEY = process.env.ALIEXPRESS_APP_KEY || '';
const APP_SECRET = process.env.ALIEXPRESS_APP_SECRET || '';
const CALLBACK_URL =
  process.env.ALIEXPRESS_CALLBACK_URL || 'http://localhost:4000/api/admin/aliexpress/callback';

/**
 * Whether the AliExpress API is configured. When false, callers should fall
 * back to the mock scraper so the app keeps working in local dev.
 */
export const isAliExpressConfigured = (): boolean => Boolean(APP_KEY && APP_SECRET);

/**
 * Timestamp for the modern api-sg.aliexpress.com gateway: epoch milliseconds
 * (as a string). The older /router/rest gateway used a "yyyy-MM-dd HH:mm:ss"
 * GMT+8 string, but the System Interface (SG) endpoints expect milliseconds,
 * otherwise AliExpress returns "IllegalTimestamp".
 */
const formatTimestamp = (date: Date = new Date()): string => String(date.getTime());

/**
 * Sign the request parameters using the TOP HMAC-SHA256 algorithm:
 * sort params by key, concatenate key+value, prefix with the API path (for the
 * /rest style endpoints) and HMAC with the app secret.
 */
const signParams = (params: Record<string, string>, apiPath?: string): string => {
  const sortedKeys = Object.keys(params).sort();
  let base = sortedKeys.map((key) => `${key}${params[key]}`).join('');
  if (apiPath) {
    base = `${apiPath}${base}`;
  }
  return crypto
    .createHmac('sha256', APP_SECRET)
    .update(base, 'utf8')
    .digest('hex')
    .toUpperCase();
};

interface CallOptions {
  /** Whether the call needs a user session/access token. */
  requiresAuth?: boolean;
}

/**
 * Perform a signed call to an AliExpress "system" (TOP) API method.
 */
const callApi = async (
  method: string,
  businessParams: Record<string, string | number | undefined>,
  options: CallOptions = {}
): Promise<any> => {
  if (!isAliExpressConfigured()) {
    throw new Error('AliExpress API is not configured (missing APP_KEY / APP_SECRET)');
  }

  const params: Record<string, string> = {
    method,
    app_key: APP_KEY,
    sign_method: 'sha256',
    timestamp: formatTimestamp(),
    format: 'json',
    v: '2.0',
    simplify: 'true',
  };

  if (options.requiresAuth) {
    const token = await getValidAccessToken();
    params.session = token;
  }

  for (const [key, value] of Object.entries(businessParams)) {
    if (value !== undefined && value !== null) {
      params[key] = String(value);
    }
  }

  params.sign = signParams(params);

  const body = new URLSearchParams(params).toString();

  const response = await fetch(GATEWAY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const json = await response.json();

  // TOP returns an error_response object on failure.
  if (json.error_response) {
    const err = json.error_response;
    throw new Error(
      `AliExpress API error [${err.code || 'unknown'}]: ${err.msg || err.sub_msg || 'unknown error'}`
    );
  }

  return json;
};

/* ------------------------------------------------------------------ *
 * OAuth / token management
 * ------------------------------------------------------------------ */

/**
 * Build the URL to which the admin should be redirected to authorize the app.
 */
export const buildAuthorizeUrl = (state: string = 'drop'): string => {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: APP_KEY,
    redirect_uri: CALLBACK_URL,
    state,
    view: 'web',
    sp: 'ae',
  });
  return `${AUTH_URL}?${params.toString()}`;
};

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  refresh_token_valid_time?: number;
  account?: string;
  user_id?: string;
}

/**
 * Exchange an authorization code (or refresh token) for an access token via the
 * /rest oauth endpoints, then persist it.
 */
const requestToken = async (
  grant: { code: string } | { refreshToken: string }
): Promise<TokenResponse> => {
  const apiPath = 'code' in grant ? '/auth/token/create' : '/auth/token/refresh';

  const params: Record<string, string> = {
    app_key: APP_KEY,
    sign_method: 'sha256',
    timestamp: formatTimestamp(),
    format: 'json',
    v: '2.0',
  };

  if ('code' in grant) {
    params.code = grant.code;
  } else {
    params.refresh_token = grant.refreshToken;
  }

  params.sign = signParams(params, apiPath);

  const body = new URLSearchParams(params).toString();
  const response = await fetch(`${TOKEN_URL}${apiPath}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const json = await response.json();
  if (json.error_response || json.code) {
    const err = json.error_response || json;
    if (err.code && err.code !== '0') {
      throw new Error(
        `AliExpress token error [${err.code}]: ${err.msg || err.sub_msg || 'unknown error'}`
      );
    }
  }

  return json as TokenResponse;
};

/**
 * Persist a token response into the single-row AliExpressToken table.
 */
const persistToken = async (token: TokenResponse): Promise<void> => {
  const now = Date.now();
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

  // AliExpress (SG gateway) returns these lifetimes in MILLISECONDS already.
  // Guard against absurd values (some responses omit them or use other units).
  const normalizeMs = (raw: number | undefined, fallback: number): number => {
    if (!raw || raw <= 0) return fallback;
    // If the value looks like seconds (too small to be a plausible ms lifetime),
    // convert it; otherwise treat it as milliseconds. Cap to ~1 year to be safe.
    const ms = raw < 1_000_000 ? raw * 1000 : raw;
    const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
    return Math.min(ms, ONE_YEAR_MS);
  };

  const expiresInMs = normalizeMs(token.expires_in, THIRTY_DAYS_MS);
  const refreshExpiresInMs = normalizeMs(token.refresh_token_valid_time, 0);

  await prisma.aliExpressToken.upsert({
    where: { id: 'singleton' },
    create: {
      id: 'singleton',
      accessToken: token.access_token,
      refreshToken: token.refresh_token || null,
      accountId: token.user_id || token.account || null,
      expiresAt: new Date(now + expiresInMs),
      refreshExpiresAt: refreshExpiresInMs ? new Date(now + refreshExpiresInMs) : null,
    },
    update: {
      accessToken: token.access_token,
      refreshToken: token.refresh_token || null,
      accountId: token.user_id || token.account || null,
      expiresAt: new Date(now + expiresInMs),
      refreshExpiresAt: refreshExpiresInMs ? new Date(now + refreshExpiresInMs) : null,
    },
  });
};

/**
 * Complete the OAuth flow: exchange the code and store the token.
 */
export const exchangeCodeForToken = async (code: string): Promise<void> => {
  const token = await requestToken({ code });
  if (!token.access_token) {
    throw new Error('AliExpress did not return an access token');
  }
  await persistToken(token);
};

/**
 * Return a valid access token, refreshing it if it is close to expiry.
 */
export const getValidAccessToken = async (): Promise<string> => {
  const stored = await prisma.aliExpressToken.findUnique({ where: { id: 'singleton' } });

  if (!stored) {
    throw new Error(
      'AliExpress account is not authorized yet. Visit /api/admin/aliexpress/authorize to connect.'
    );
  }

  // Refresh if it expires within the next hour.
  const soon = Date.now() + 60 * 60 * 1000;
  if (stored.expiresAt.getTime() <= soon && stored.refreshToken) {
    try {
      const refreshed = await requestToken({ refreshToken: stored.refreshToken });
      if (refreshed.access_token) {
        await persistToken(refreshed);
        return refreshed.access_token;
      }
    } catch (error) {
      console.error('Failed to refresh AliExpress token, using existing one:', error);
    }
  }

  return stored.accessToken;
};

/**
 * Whether an AliExpress account has been connected (token present).
 */
export const hasValidAuthorization = async (): Promise<boolean> => {
  const stored = await prisma.aliExpressToken.findUnique({ where: { id: 'singleton' } });
  return Boolean(stored);
};

/* ------------------------------------------------------------------ *
 * Product data
 * ------------------------------------------------------------------ */

export interface AliExpressSku {
  skuId: string;
  skuAttr: string;
  properties: string;
  price: number;
  originalPrice: number;
  currency: string;
  stock: number;
  image?: string;
}

/**
 * Fetch a product via aliexpress.ds.product.get and map it to the shared
 * ProductData shape, enriched with the SKU list required to place an order.
 */
export const getProduct = async (
  productId: string,
  options: { shipToCountry?: string; currency?: string; language?: string } = {}
): Promise<ProductData & { skus: AliExpressSku[] }> => {
  const result = await callApi(
    'aliexpress.ds.product.get',
    {
      product_id: productId,
      ship_to_country: options.shipToCountry || 'FR',
      target_currency: options.currency || 'EUR',
      target_language: options.language || 'FR',
    },
    { requiresAuth: true }
  );

  const resp =
    result?.aliexpress_ds_product_get_response?.result ||
    result?.result ||
    result;

  return mapProductResponse(productId, resp);
};

const toNumber = (value: unknown, fallback = 0): number => {
  const n = parseFloat(String(value ?? ''));
  return Number.isFinite(n) ? n : fallback;
};

/**
 * Map the (fairly deep) AliExpress product response into our ProductData shape.
 * The API's exact field names can vary by version; we defensively read the
 * common locations.
 */
const mapProductResponse = (
  productId: string,
  resp: any
): ProductData & { skus: AliExpressSku[] } => {
  const baseInfo = resp?.ae_item_base_info_dto || resp?.item_base_info || {};
  const skuInfo =
    resp?.ae_item_sku_info_dtos?.ae_item_sku_info_d_t_o ||
    resp?.ae_item_sku_info_dtos ||
    [];
  const mediaInfo = resp?.ae_multimedia_info_dto || resp?.multimedia_info || {};
  const storeInfo = resp?.ae_store_info || resp?.store_info || {};
  const propsRaw =
    resp?.ae_item_properties?.ae_item_property ||
    resp?.item_properties ||
    [];

  const skuArray = Array.isArray(skuInfo) ? skuInfo : skuInfo ? [skuInfo] : [];

  const skus: AliExpressSku[] = skuArray.map((sku: any) => {
    const propList =
      sku?.ae_sku_property_dtos?.ae_sku_property_d_t_o ||
      sku?.sku_property_list ||
      [];
    const propArray = Array.isArray(propList) ? propList : propList ? [propList] : [];
    const propImage = propArray.find((p: any) => p?.sku_image)?.sku_image;
    const humanProps = propArray
      .map((p: any) => `${p?.sku_property_name}: ${p?.property_value_definition_name || p?.sku_property_value}`)
      .join(', ');

    return {
      skuId: String(sku?.sku_id ?? ''),
      skuAttr: String(sku?.sku_attr ?? sku?.id ?? ''),
      properties: humanProps,
      price: toNumber(sku?.offer_sale_price ?? sku?.sku_price ?? sku?.offer_bulk_sale_price),
      originalPrice: toNumber(sku?.sku_price ?? sku?.offer_sale_price),
      currency: String(sku?.currency_code || 'EUR'),
      stock: toNumber(sku?.sku_available_stock ?? sku?.ipm_sku_stock, 0),
      image: propImage,
    };
  });

  const firstSku = skus[0];
  const currentPrice = firstSku?.price ?? toNumber(baseInfo?.sale_price ?? baseInfo?.target_sale_price);
  const originalPrice = firstSku?.originalPrice ?? toNumber(baseInfo?.original_price ?? currentPrice);
  const currency = firstSku?.currency || baseInfo?.currency_code || 'EUR';

  const price: PriceInfo = {
    current: currentPrice,
    original: originalPrice,
    currency,
    discount:
      originalPrice > currentPrice
        ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
        : 0,
  };

  const imageStr: string =
    mediaInfo?.image_urls || baseInfo?.image_u_r_ls || baseInfo?.image_urls || '';
  const images = imageStr
    ? imageStr.split(';').map((s: string) => s.trim()).filter(Boolean)
    : [];

  const propsArray = Array.isArray(propsRaw) ? propsRaw : propsRaw ? [propsRaw] : [];
  const specs: Record<string, string> = {};
  for (const p of propsArray) {
    const key = p?.attr_name || p?.attr_name_id;
    const value = p?.attr_value;
    if (key && value) specs[String(key)] = String(value);
  }

  const variants: Variant[] = skus.map((sku) => ({
    id: sku.skuId,
    name: sku.properties || sku.skuAttr,
    price: sku.price,
    image: sku.image,
    stock: sku.stock,
  }));

  const seller: SellerInfo = {
    name: String(storeInfo?.store_name || 'AliExpress Seller'),
    rating: String(storeInfo?.store_rate_percent ?? storeInfo?.positive_rate ?? 'N/A'),
    positiveFeeback: String(storeInfo?.store_rate_percent ?? 'N/A'),
  };

  const reviews: Reviews = {
    count: String(baseInfo?.evaluation_count ?? resp?.ae_item_base_info_dto?.evaluation_count ?? '0'),
    rating: String(baseInfo?.avg_evaluation_rating ?? baseInfo?.evaluation_rating ?? 'N/A'),
  };

  return {
    aliexpressId: productId,
    title: String(baseInfo?.subject || baseInfo?.title || 'AliExpress Product'),
    price,
    description: String(baseInfo?.detail || baseInfo?.mobile_detail || ''),
    images: images.length ? images : ['No images found'],
    specs,
    variants,
    seller,
    shipping: 'See shipping options at checkout',
    reviews,
    url: `https://www.aliexpress.com/item/${productId}.html`,
    skus,
  };
};

/* ------------------------------------------------------------------ *
 * Freight / shipping
 * ------------------------------------------------------------------ */

export interface FreightOption {
  serviceName: string;
  company: string;
  cost: number;
  currency: string;
  estimatedDelivery: string;
  tracking: boolean;
}

/**
 * Query freight/shipping options for a product+quantity to a given country.
 */
export const queryFreight = async (params: {
  productId: string;
  quantity: number;
  shipToCountry: string;
  skuId?: string;
  currency?: string;
}): Promise<FreightOption[]> => {
  const queryDto = JSON.stringify({
    product_id: params.productId,
    quantity: params.quantity,
    ship_to_country: params.shipToCountry,
    sku_id: params.skuId,
    currency: params.currency || 'EUR',
    language: 'en_US',
  });

  const result = await callApi(
    'aliexpress.ds.freight.query',
    { queryDeliveryReq: queryDto },
    { requiresAuth: true }
  );

  const resp =
    result?.aliexpress_ds_freight_query_response?.result ||
    result?.result ||
    result;

  const list =
    resp?.delivery_options?.delivery_option_d_t_o ||
    resp?.delivery_options ||
    [];
  const options = Array.isArray(list) ? list : list ? [list] : [];

  return options.map((o: any) => ({
    serviceName: String(o?.service_name || o?.company || 'Standard'),
    company: String(o?.company || ''),
    cost: toNumber(o?.shipping_fee_cent, 0) / 100 || toNumber(o?.freight_amount?.amount),
    currency: String(o?.freight_amount?.currency_code || params.currency || 'EUR'),
    estimatedDelivery: String(o?.estimated_delivery_time || o?.delivery_date_desc || 'N/A'),
    tracking: Boolean(o?.tracking),
  }));
};

/* ------------------------------------------------------------------ *
 * Order placement & tracking
 * ------------------------------------------------------------------ */

export interface AliExpressAddress {
  contactPerson: string;
  address: string;
  address2?: string;
  city: string;
  province: string;
  zip: string;
  country: string;
  phoneCountry?: string;
  mobileNo?: string;
}

export interface AliExpressOrderItem {
  productId: string;
  skuAttr?: string;
  quantity: number;
}

export interface PlacedOrder {
  aliexpressOrderId: string;
  raw: any;
}

/**
 * Place an order on AliExpress via aliexpress.ds.order.create. The buyer is
 * your dropshipping account; the shipping address is the end customer's.
 */
export const createOrder = async (params: {
  address: AliExpressAddress;
  items: AliExpressOrderItem[];
}): Promise<PlacedOrder> => {
  const logisticsAddress = {
    contact_person: params.address.contactPerson,
    address: params.address.address,
    address2: params.address.address2 || '',
    city: params.address.city,
    province: params.address.province,
    zip: params.address.zip,
    country: params.address.country,
    phone_country: params.address.phoneCountry || '',
    mobile_no: params.address.mobileNo || '',
    full_name: params.address.contactPerson,
  };

  const productItems = params.items.map((item) => ({
    product_id: item.productId,
    sku_attr: item.skuAttr || '',
    product_count: item.quantity,
    logistics_service_name: undefined,
  }));

  const paramPlaceOrderRequest = JSON.stringify({
    logistics_address: logisticsAddress,
    product_items: productItems,
  });

  if (process.env.ALIEXPRESS_DEBUG === 'true') {
    console.log('[AliExpress] order.create request:', paramPlaceOrderRequest);
  }

  const result = await callApi(
    'aliexpress.ds.order.create',
    { param_place_order_request4_open_api_d_t_o: paramPlaceOrderRequest },
    { requiresAuth: true }
  );

  if (process.env.ALIEXPRESS_DEBUG === 'true') {
    console.log('[AliExpress] order.create raw response:', JSON.stringify(result).slice(0, 1000));
  }

  const resp =
    result?.aliexpress_ds_order_create_response?.result ||
    result?.result ||
    result;

  const orderList =
    resp?.order_list?.number ||
    resp?.order_list ||
    resp?.orderList ||
    [];
  const orderIds = Array.isArray(orderList) ? orderList : orderList ? [orderList] : [];
  const aliexpressOrderId = orderIds.length ? String(orderIds[0]) : '';

  if (!aliexpressOrderId) {
    throw new Error(
      `AliExpress order creation returned no order id: ${JSON.stringify(resp).slice(0, 300)}`
    );
  }

  return { aliexpressOrderId, raw: resp };
};

export interface TrackingResult {
  trackingNumber?: string;
  status?: string;
  raw: any;
}

/**
 * Retrieve tracking info for a placed order via
 * aliexpress.ds.order.tracking.get.
 */
export const getTracking = async (aliexpressOrderId: string): Promise<TrackingResult> => {
  const result = await callApi(
    'aliexpress.ds.order.tracking.get',
    {
      ae_order_id: aliexpressOrderId,
      language: 'en_US',
    },
    { requiresAuth: true }
  );

  const resp =
    result?.aliexpress_ds_order_tracking_get_response?.result ||
    result?.result ||
    result;

  const details =
    resp?.tracking_detail_line_list?.tracking_detail?.[0] ||
    resp?.details?.[0] ||
    resp;

  return {
    trackingNumber:
      resp?.mail_no || resp?.tracking_number || details?.mail_no || undefined,
    status: resp?.official_website || resp?.status || details?.status || undefined,
    raw: resp,
  };
};
