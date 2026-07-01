import { PrismaClient, Order, OrderStatus, Prisma } from '@prisma/client';
import * as StripeService from './Stripe.service';
import * as AliExpress from './AliExpressApi.service';

const prisma = new PrismaClient();

export interface CreateOrderInput {
  stripePaymentId: string;
  productId: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  skuId?: string;
  skuAttr?: string;
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  quantity: number;
  totalPaid: number;
}

export interface AliExpressOrderDetails {
  orderId: string;
  trackingNumber?: string;
}

/**
 * Create a new order from Stripe webhook
 */
export const createOrder = async (input: CreateOrderInput): Promise<Order> => {
  try {
    const order = await prisma.order.create({
      data: {
        stripePaymentId: input.stripePaymentId,
        productId: input.productId,
        customerEmail: input.customerEmail,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        skuId: input.skuId,
        skuAttr: input.skuAttr,
        shippingAddress: input.shippingAddress as Prisma.JsonObject,
        quantity: input.quantity,
        totalPaid: input.totalPaid,
        orderStatus: 'PAID',
      },
      include: {
        product: true,
      },
    });
    
    return order;
  } catch (error) {
    console.error('Error creating order:', error);
    throw new Error('Failed to create order');
  }
};

/**
 * Get order by ID
 */
export const getOrderById = async (id: string): Promise<Order | null> => {
  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        product: true,
      },
    });
    
    return order;
  } catch (error) {
    console.error('Error fetching order:', error);
    throw new Error('Failed to fetch order');
  }
};

/**
 * Get order by Stripe payment ID
 */
export const getOrderByStripePaymentId = async (stripePaymentId: string): Promise<Order | null> => {
  try {
    const order = await prisma.order.findUnique({
      where: { stripePaymentId },
      include: {
        product: true,
      },
    });
    
    return order;
  } catch (error) {
    console.error('Error fetching order by Stripe payment ID:', error);
    throw new Error('Failed to fetch order');
  }
};

/**
 * Get all orders with optional filters
 */
export const getAllOrders = async (options?: {
  skip?: number;
  take?: number;
  where?: Prisma.OrderWhereInput;
  orderBy?: Prisma.OrderOrderByWithRelationInput;
}): Promise<{ orders: Order[]; total: number }> => {
  try {
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        skip: options?.skip || 0,
        take: options?.take || 20,
        where: options?.where,
        orderBy: options?.orderBy || { createdAt: 'desc' },
        include: {
          product: true,
        },
      }),
      prisma.order.count({ where: options?.where }),
    ]);
    
    return { orders, total };
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw new Error('Failed to fetch orders');
  }
};

/**
 * Update order status
 */
export const updateOrderStatus = async (
  id: string, 
  status: OrderStatus,
  additionalData?: {
    aliexpressOrderId?: string;
    trackingNumber?: string;
  }
): Promise<Order> => {
  try {
    const order = await prisma.order.update({
      where: { id },
      data: {
        orderStatus: status,
        ...(additionalData?.aliexpressOrderId && { aliexpressOrderId: additionalData.aliexpressOrderId }),
        ...(additionalData?.trackingNumber && { trackingNumber: additionalData.trackingNumber }),
      },
      include: {
        product: true,
      },
    });
    
    return order;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw new Error('Failed to update order status');
  }
};

/**
 * Place the order on AliExpress using the official Dropshipping API.
 * The customer's shipping address is used as the delivery address; the buyer
 * (payer) is your connected AliExpress dropshipping account.
 */
export const fulfillOrderViaApi = async (orderId: string): Promise<AliExpressOrderDetails> => {
  const order = await getOrderById(orderId);
  if (!order) {
    throw new Error('Order not found');
  }

  const product = (order as any).product;
  const shippingAddress = order.shippingAddress as any;

  // Move to ORDERING while we place the order.
  await updateOrderStatus(orderId, 'ORDERING');

  try {
    if (!AliExpress.isAliExpressConfigured()) {
      throw new Error('AliExpress API is not configured on the server.');
    }

    const address: AliExpress.AliExpressAddress = {
      contactPerson: order.customerName,
      address: shippingAddress.line1 || '',
      address2: shippingAddress.line2 || '',
      city: shippingAddress.city || '',
      province: shippingAddress.state || '',
      zip: shippingAddress.postalCode || '',
      country: shippingAddress.country || '',
      mobileNo: order.customerPhone || '',
      phoneCountry: '',
    };

    const placed = await AliExpress.createOrder({
      address,
      items: [
        {
          productId: product.aliexpressId,
          skuAttr: order.skuAttr || undefined,
          quantity: order.quantity,
        },
      ],
    });

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        orderStatus: 'ORDERED',
        aliexpressOrderId: placed.aliexpressOrderId,
        aliexpressStatus: 'PLACE_ORDER_SUCCESS',
        fulfillmentError: null,
      },
    });

    return {
      orderId: updated.aliexpressOrderId || placed.aliexpressOrderId,
      trackingNumber: updated.trackingNumber || undefined,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown fulfillment error';
    console.error('Error fulfilling order on AliExpress:', message);
    await prisma.order.update({
      where: { id: orderId },
      data: { orderStatus: 'FAILED', fulfillmentError: message },
    });
    throw error;
  }
};

/**
 * Backwards-compatible alias for the admin "Fulfill" button.
 */
export const fulfillOrderOnAliExpress = fulfillOrderViaApi;

/**
 * Refresh tracking info for an order from AliExpress and update its status.
 */
export const refreshOrderTracking = async (orderId: string): Promise<Order> => {
  const order = await getOrderById(orderId);
  if (!order) {
    throw new Error('Order not found');
  }
  if (!order.aliexpressOrderId) {
    throw new Error('Order has no AliExpress order id yet');
  }

  const tracking = await AliExpress.getTracking(order.aliexpressOrderId);

  const data: Prisma.OrderUpdateInput = {};
  if (tracking.trackingNumber) {
    data.trackingNumber = tracking.trackingNumber;
    // A tracking number means the parcel has shipped.
    if (order.orderStatus === 'ORDERED') {
      data.orderStatus = 'SHIPPED';
    }
  }
  if (tracking.status) {
    data.aliexpressStatus = tracking.status;
  }

  return prisma.order.update({
    where: { id: orderId },
    data,
    include: { product: true },
  });
};

/**
 * Process refund for an order
 */
export const refundOrder = async (orderId: string, amount?: number): Promise<Order> => {
  try {
    const order = await getOrderById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }
    
    if (order.orderStatus === 'REFUNDED') {
      throw new Error('Order already refunded');
    }
    
    // Create refund in Stripe
    await StripeService.createRefund(
      order.stripePaymentId, 
      amount || order.totalPaid.toNumber()
    );
    
    // Update order status
    const updatedOrder = await updateOrderStatus(orderId, 'REFUNDED');
    
    return updatedOrder;
  } catch (error) {
    console.error('Error refunding order:', error);
    throw error;
  }
};

/**
 * Get order statistics
 */
export const getOrderStatistics = async (): Promise<{
  totalOrders: number;
  totalRevenue: number;
  ordersByStatus: Record<OrderStatus, number>;
  recentOrders: Order[];
}> => {
  try {
    const [totalOrders, orders, ordersByStatus, recentOrders] = await Promise.all([
      prisma.order.count(),
      prisma.order.findMany({
        select: { totalPaid: true },
        where: {
          orderStatus: {
            in: ['PAID', 'ORDERING', 'ORDERED', 'SHIPPED', 'DELIVERED'],
          },
        },
      }),
      prisma.order.groupBy({
        by: ['orderStatus'],
        _count: {
          orderStatus: true,
        },
      }),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { product: true },
      }),
    ]);
    
    const totalRevenue = orders.reduce(
      (sum, order) => sum + order.totalPaid.toNumber(), 
      0
    );
    
    const statusCounts = ordersByStatus.reduce((acc, item) => {
      acc[item.orderStatus] = item._count.orderStatus;
      return acc;
    }, {} as Record<OrderStatus, number>);
    
    // Ensure all statuses are represented
    const allStatuses: OrderStatus[] = ['PENDING', 'PAID', 'ORDERING', 'ORDERED', 'SHIPPED', 'DELIVERED', 'FAILED', 'REFUNDED'];
    allStatuses.forEach(status => {
      if (!statusCounts[status]) {
        statusCounts[status] = 0;
      }
    });
    
    return {
      totalOrders,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      ordersByStatus: statusCounts,
      recentOrders,
    };
  } catch (error) {
    console.error('Error getting order statistics:', error);
    throw new Error('Failed to get order statistics');
  }
};