import { Request, Response } from 'express';
import * as AuthService from '../services/Auth.service';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body;
    
    // Validate input
    if (!email || !password || !name) {
      res.status(400).json({ error: 'Email, password, and name are required' });
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }
    
    // Validate password strength
    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long' });
      return;
    }
    
    const result = await AuthService.register({ email, password, name });
    
    res.status(201).json({
      success: true,
      token: result.token,
      admin: result.admin,
    });
  } catch (error) {
    console.error('Registration error:', error);
    const statusCode = error instanceof Error && error.message.includes('already exists') ? 409 : 500;
    res.status(statusCode).json({
      success: false,
      error: error instanceof Error ? error.message : 'Registration failed',
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }
    
    const result = await AuthService.login({ email, password });
    
    res.json({
      success: true,
      token: result.token,
      admin: result.admin,
    });
  } catch (error) {
    console.error('Login error:', error);
    const statusCode = error instanceof Error && error.message.includes('Invalid') ? 401 : 500;
    res.status(statusCode).json({
      success: false,
      error: error instanceof Error ? error.message : 'Login failed',
    });
  }
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    // Admin is attached by auth middleware
    if (!req.admin) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    
    const admin = await AuthService.getAdminById(req.admin.id);
    
    if (!admin) {
      res.status(404).json({ error: 'Admin not found' });
      return;
    }
    
    res.json({
      success: true,
      admin,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch profile',
    });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    
    const { name, email, password } = req.body;
    
    // Validate email if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({ error: 'Invalid email format' });
        return;
      }
    }
    
    // Validate password if provided
    if (password && password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long' });
      return;
    }
    
    const admin = await AuthService.updateAdmin(req.admin.id, {
      name,
      email,
      password,
    });
    
    res.json({
      success: true,
      admin,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update profile',
    });
  }
};