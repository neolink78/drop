import { PrismaClient, Admin } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '7d';

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface AuthPayload {
  token: string;
  admin: Omit<Admin, 'password'>;
}

export interface JwtPayload {
  id: string;
  email: string;
}

/**
 * Hash password using bcrypt
 */
const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Verify password using bcrypt
 */
const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

/**
 * Generate JWT token
 */
const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Verify JWT token
 */
export const verifyToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * Register a new admin
 */
export const register = async (input: RegisterInput): Promise<AuthPayload> => {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { email: input.email },
    });
    
    if (existingAdmin) {
      throw new Error('Admin with this email already exists');
    }
    
    // Hash password
    const hashedPassword = await hashPassword(input.password);
    
    // Create admin
    const admin = await prisma.admin.create({
      data: {
        email: input.email,
        password: hashedPassword,
        name: input.name,
      },
    });
    
    // Generate token
    const token = generateToken({ id: admin.id, email: admin.email });
    
    // Remove password from response
    const { password, ...adminWithoutPassword } = admin;
    
    return {
      token,
      admin: adminWithoutPassword,
    };
  } catch (error) {
    console.error('Error registering admin:', error);
    throw error;
  }
};

/**
 * Login admin
 */
export const login = async (input: LoginInput): Promise<AuthPayload> => {
  try {
    // Find admin by email
    const admin = await prisma.admin.findUnique({
      where: { email: input.email },
    });
    
    if (!admin) {
      throw new Error('Invalid email or password');
    }
    
    // Check if admin is active
    if (!admin.isActive) {
      throw new Error('Account is deactivated');
    }
    
    // Verify password
    const isPasswordValid = await verifyPassword(input.password, admin.password);
    
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }
    
    // Generate token
    const token = generateToken({ id: admin.id, email: admin.email });
    
    // Remove password from response
    const { password, ...adminWithoutPassword } = admin;
    
    return {
      token,
      admin: adminWithoutPassword,
    };
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

/**
 * Get admin by ID
 */
export const getAdminById = async (id: string): Promise<Omit<Admin, 'password'> | null> => {
  try {
    const admin = await prisma.admin.findUnique({
      where: { id },
    });
    
    if (!admin) {
      return null;
    }
    
    // Remove password from response
    const { password, ...adminWithoutPassword } = admin;
    
    return adminWithoutPassword;
  } catch (error) {
    console.error('Error fetching admin:', error);
    throw new Error('Failed to fetch admin');
  }
};

/**
 * Update admin
 */
export const updateAdmin = async (
  id: string,
  data: { name?: string; email?: string; password?: string }
): Promise<Omit<Admin, 'password'>> => {
  try {
    const updateData: any = {};
    
    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.password) updateData.password = await hashPassword(data.password);
    
    const admin = await prisma.admin.update({
      where: { id },
      data: updateData,
    });
    
    // Remove password from response
    const { password, ...adminWithoutPassword } = admin;
    
    return adminWithoutPassword;
  } catch (error) {
    console.error('Error updating admin:', error);
    throw new Error('Failed to update admin');
  }
};

/**
 * Create default admin if none exists
 */
export const createDefaultAdmin = async (): Promise<void> => {
  try {
    const adminCount = await prisma.admin.count();
    
    if (adminCount === 0) {
      const defaultEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
      const defaultPassword = 'admin123'; // Change this in production!
      
      await register({
        email: defaultEmail,
        password: defaultPassword,
        name: 'Default Admin',
      });
      
      console.log(`Default admin created with email: ${defaultEmail}`);
      console.log('Please change the password immediately!');
    }
  } catch (error) {
    console.error('Error creating default admin:', error);
  }
};