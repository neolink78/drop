import { Request, Response } from 'express';
import * as StripeService from '../services/Stripe.service';
import * as ProductService from '../services/Product.service';
import * as OrderService from '../services/Order.service';

export const createCheckoutSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId, quantity = 1, customerEmail, skuId, skuAttr } = req.body;
    
    if (!productId) {
      res.status(400).json({ error: 'Product ID is required' });
      return;
    }
    
    // Get product details
    const product = await ProductService.getProductById(productId);
    
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    
    // Create checkout session
    const session = await StripeService.createCheckoutSession({
      productId: product.id,
      productTitle: product.title,
      price: product.markupPrice.toNumber(),
      quantity,
      customerEmail,
      skuId,
      skuAttr,
      images: product.images as string[],
    });
    
    res.json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create checkout session',
    });
  }
};

export const handleStripeWebhook = async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'] as string;
  
  if (!sig) {
    res.status(400).send('No signature provided');
    return;
  }
  
  try {
    const event = StripeService.constructWebhookEvent(req.body, sig);
    
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const paymentData = await StripeService.handlePaymentSuccess(session);
        
        // Retrieve full session details (with shipping + customer details expanded)
        const fullSession = await StripeService.retrieveCheckoutSession(session.id);
        const shipping = fullSession.collected_information?.shipping_details;
        const customer = fullSession.customer_details;
        const metadata = fullSession.metadata || {};
        
        // Create order in database
        if (metadata.productId) {
          const order = await OrderService.createOrder({
            stripePaymentId: paymentData.paymentIntentId,
            productId: metadata.productId,
            customerEmail: customer?.email || fullSession.customer_email || '',
            customerName: shipping?.name || customer?.name || 'Customer',
            customerPhone: customer?.phone || undefined,
            skuId: metadata.skuId || undefined,
            skuAttr: metadata.skuAttr || undefined,
            shippingAddress: {
              line1: shipping?.address?.line1 || '',
              line2: shipping?.address?.line2 || undefined,
              city: shipping?.address?.city || '',
              state: shipping?.address?.state || '',
              postalCode: shipping?.address?.postal_code || '',
              country: shipping?.address?.country || '',
            },
            quantity: metadata.quantity ? parseInt(metadata.quantity, 10) : 1,
            totalPaid: paymentData.amount,
          });
          
          console.log('Order created for payment:', paymentData.paymentIntentId);
          
          // Automatically place the order on AliExpress. Runs in the background
          // so we can acknowledge the webhook quickly; failures are recorded on
          // the order (status FAILED) for manual retry from the admin.
          OrderService.fulfillOrderViaApi(order.id).catch((err) => {
            console.error('Auto-fulfillment failed for order', order.id, err);
          });
        }
        
        break;
      }
      
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as any;
        console.log('Payment failed:', paymentIntent.id);
        
        // Update order status if it exists
        const order = await OrderService.getOrderByStripePaymentId(paymentIntent.id);
        if (order) {
          await OrderService.updateOrderStatus(order.id, 'FAILED');
        }
        break;
      }
      
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send(`Webhook Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const createPaymentLink = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.body;
    
    if (!productId) {
      res.status(400).json({ error: 'Product ID is required' });
      return;
    }
    
    // Get product details
    const product = await ProductService.getProductById(productId);
    
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    
    // Create payment link
    const paymentLink = await StripeService.createPaymentLink({
      productTitle: product.title,
      price: product.markupPrice.toNumber(),
      productId: product.id,
      images: product.images as string[],
    });
    
    res.json({
      success: true,
      paymentUrl: paymentLink.url,
    });
  } catch (error) {
    console.error('Error creating payment link:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create payment link',
    });
  }
};