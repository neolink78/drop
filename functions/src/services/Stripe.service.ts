import Stripe from 'stripe';
import { Product, Order, Prisma } from '@prisma/client';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
});

export interface CheckoutSessionData {
  productId: string;
  productTitle: string;
  price: number;
  quantity: number;
  customerEmail?: string;
  images: string[];
  skuId?: string;
  skuAttr?: string;
  shippingAddress?: {
    name: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
  };
}

export interface WebhookEvent {
  type: string;
  data: any;
}

/**
 * Create a Stripe checkout session for a product
 */
export const createCheckoutSession = async (data: CheckoutSessionData): Promise<Stripe.Checkout.Session> => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: data.productTitle,
              images: data.images.slice(0, 8), // Stripe allows max 8 images
              metadata: {
                productId: data.productId,
              },
            },
            unit_amount: Math.round(data.price * 100), // Convert to cents
          },
          quantity: data.quantity,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/`,
      customer_email: data.customerEmail,
      // Collect phone: AliExpress requires a mobile number for shipping.
      phone_number_collection: { enabled: true },
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'FR', 'DE', 'ES', 'IT', 'NL', 'BE', 'PT', 'AT', 'IE'],
      },
      metadata: {
        productId: data.productId,
        skuId: data.skuId || '',
        skuAttr: data.skuAttr || '',
        quantity: String(data.quantity),
      },
    });

    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw new Error('Failed to create checkout session');
  }
};

/**
 * Retrieve a checkout session by ID
 */
export const retrieveCheckoutSession = async (sessionId: string): Promise<Stripe.Checkout.Session> => {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'customer', 'payment_intent'],
    });
    return session;
  } catch (error) {
    console.error('Error retrieving checkout session:', error);
    throw new Error('Failed to retrieve checkout session');
  }
};

/**
 * Verify webhook signature and construct event
 */
export const constructWebhookEvent = (payload: string | Buffer, signature: string): Stripe.Event => {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    return event;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    throw new Error('Invalid webhook signature');
  }
};

/**
 * Handle successful payment
 */
export const handlePaymentSuccess = async (session: Stripe.Checkout.Session): Promise<{
  sessionId: string;
  paymentIntentId: string;
  amount: number;
  customerEmail: string | null;
  metadata: any;
}> => {
  const paymentIntent = session.payment_intent as string;
  const amount = session.amount_total ? session.amount_total / 100 : 0; // Convert from cents
  
  return {
    sessionId: session.id,
    paymentIntentId: paymentIntent,
    amount,
    customerEmail: session.customer_email,
    metadata: session.metadata || {},
  };
};

/**
 * Create a refund for an order
 */
export const createRefund = async (paymentIntentId: string, amount?: number): Promise<Stripe.Refund> => {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined, // Convert to cents if amount provided
    });
    return refund;
  } catch (error) {
    console.error('Error creating refund:', error);
    throw new Error('Failed to create refund');
  }
};

/**
 * Calculate Stripe fees and net amount
 */
export const calculateFees = (amount: number, currency: string = 'eur'): {
  grossAmount: number;
  stripeFee: number;
  netAmount: number;
} => {
  // Stripe fees for Europe: 1.5% + €0.25 for European cards
  const percentageFee = 0.015; // 1.5%
  const fixedFee = 0.25; // €0.25
  
  const stripeFee = (amount * percentageFee) + fixedFee;
  const netAmount = amount - stripeFee;
  
  return {
    grossAmount: amount,
    stripeFee: Math.round(stripeFee * 100) / 100, // Round to 2 decimal places
    netAmount: Math.round(netAmount * 100) / 100,
  };
};

/**
 * Generate a payment link for a product
 */
export const createPaymentLink = async (data: {
  productTitle: string;
  price: number;
  productId: string;
  images?: string[];
}): Promise<Stripe.PaymentLink> => {
  try {
    // First create a product
    const product = await stripe.products.create({
      name: data.productTitle,
      images: data.images?.slice(0, 8),
      metadata: {
        productId: data.productId,
      },
    });

    // Then create a price
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(data.price * 100), // Convert to cents
      currency: 'eur',
    });

    // Finally create the payment link
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      after_completion: {
        type: 'redirect',
        redirect: {
          url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/success`,
        },
      },
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'FR', 'DE', 'ES', 'IT', 'NL', 'BE', 'PT', 'AT', 'IE'],
      },
      metadata: {
        productId: data.productId,
      },
    });

    return paymentLink;
  } catch (error) {
    console.error('Error creating payment link:', error);
    throw new Error('Failed to create payment link');
  }
};