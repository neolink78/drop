import { Request, Response } from 'express';
import * as OrderService from '../services/Order.service';
import { OrderStatus } from '@prisma/client';

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const orderData = req.body;
    
    // Validate required fields
    const requiredFields = ['stripePaymentId', 'productId', 'customerEmail', 'customerName', 'shippingAddress', 'quantity', 'totalPaid'];
    for (const field of requiredFields) {
      if (!orderData[field]) {
        res.status(400).json({ error: `${field} is required` });
        return;
      }
    }
    
    const order = await OrderService.createOrder(orderData);
    
    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create order',
    });
  }
};

/**
 * Public order status lookup for the customer "track my order" page.
 * Requires order id + matching email; no admin auth.
 */
export const getPublicOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const orderId = (req.query.order as string) || '';
    const email = (req.query.email as string) || '';

    if (!orderId || !email) {
      res.status(400).json({ success: false, error: 'Numéro de commande et email requis' });
      return;
    }

    const status = await OrderService.getPublicOrderStatus(orderId, email);

    if (!status) {
      res.status(404).json({
        success: false,
        error: 'Aucune commande trouvée pour ce numéro et cet email.',
      });
      return;
    }

    res.json({ success: true, data: status });
  } catch (error) {
    console.error('Error fetching public order status:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération de la commande' });
  }
};

export const getAllOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      page = '1', 
      limit = '20', 
      status, 
      customerEmail,
      sortBy = 'createdAt', 
      order = 'desc' 
    } = req.query;
    
    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const skip = (pageNumber - 1) * limitNumber;
    
    // Build where clause
    const where: any = {};
    if (status) {
      where.orderStatus = status as OrderStatus;
    }
    if (customerEmail) {
      where.customerEmail = { contains: customerEmail as string, mode: 'insensitive' };
    }
    
    const { orders, total } = await OrderService.getAllOrders({
      skip,
      take: limitNumber,
      where,
      orderBy: { [sortBy as string]: order },
    });
    
    res.json({
      success: true,
      data: orders,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch orders',
    });
  }
};

export const getOrderById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const order = await OrderService.getOrderById(id);
    
    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found',
      });
      return;
    }
    
    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch order',
    });
  }
};

export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, aliexpressOrderId, trackingNumber } = req.body;
    
    if (!status) {
      res.status(400).json({
        success: false,
        error: 'Status is required',
      });
      return;
    }
    
    // Validate status
    const validStatuses: OrderStatus[] = ['PENDING', 'PAID', 'ORDERING', 'ORDERED', 'SHIPPED', 'DELIVERED', 'FAILED', 'REFUNDED'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        error: 'Invalid status',
      });
      return;
    }
    
    const order = await OrderService.updateOrderStatus(id, status, {
      aliexpressOrderId,
      trackingNumber,
    });
    
    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update order status',
    });
  }
};

export const fulfillOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Check if order exists and is in the right status
    const order = await OrderService.getOrderById(id);
    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found',
      });
      return;
    }
    
    // PAID = first fulfillment, FAILED = manual retry from the admin.
    if (!['PAID', 'FAILED'].includes(order.orderStatus)) {
      res.status(400).json({
        success: false,
        error: 'Order must be in PAID or FAILED status to fulfill',
      });
      return;
    }
    
    const orderDetails = await OrderService.fulfillOrderOnAliExpress(id);
    
    res.json({
      success: true,
      message: 'Order fulfillment initiated',
      data: orderDetails,
    });
  } catch (error) {
    console.error('Error fulfilling order:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fulfill order',
    });
  }
};

export const refreshTracking = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const order = await OrderService.refreshOrderTracking(id);

    res.json({
      success: true,
      message: 'Tracking refreshed',
      data: order,
    });
  } catch (error) {
    console.error('Error refreshing tracking:', error);
    const statusCode = error instanceof Error && error.message === 'Order not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to refresh tracking',
    });
  }
};

export const refundOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    
    const order = await OrderService.refundOrder(id, amount);
    
    res.json({
      success: true,
      message: 'Order refunded successfully',
      data: order,
    });
  } catch (error) {
    console.error('Error refunding order:', error);
    const statusCode = 
      error instanceof Error && error.message === 'Order not found' ? 404 :
      error instanceof Error && error.message === 'Order already refunded' ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to refund order',
    });
  }
};

export const getOrderStatistics = async (req: Request, res: Response): Promise<void> => {
  try {
    const statistics = await OrderService.getOrderStatistics();
    
    res.json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    console.error('Error fetching order statistics:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch order statistics',
    });
  }
};