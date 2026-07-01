import { Request, Response, NextFunction } from 'express';
import { verifyToken, getAdminById } from '../services/Auth.service';

// Extend Express Request type to include admin
declare global {
  namespace Express {
    interface Request {
      admin?: {
        id: string;
        email: string;
        name: string;
      };
    }
  }
}

/**
 * Authentication middleware
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }
    
    // Extract token from Bearer scheme
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;
    
    // Verify token
    const decoded = verifyToken(token);
    
    // Get admin details
    const admin = await getAdminById(decoded.id);
    
    if (!admin || !admin.isActive) {
      res.status(401).json({ error: 'Invalid token or account deactivated' });
      return;
    }
    
    // Attach admin to request
    req.admin = {
      id: admin.id,
      email: admin.email,
      name: admin.name,
    };
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ 
      error: error instanceof Error ? error.message : 'Authentication failed' 
    });
  }
};

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      next();
      return;
    }
    
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;
    
    const decoded = verifyToken(token);
    const admin = await getAdminById(decoded.id);
    
    if (admin && admin.isActive) {
      req.admin = {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      };
    }
    
    next();
  } catch (error) {
    // Silent fail, continue without authentication
    next();
  }
};