import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import bcrypt from 'bcryptjs';

export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string;
  balance: number;
  avatar?: string;
}

export class UserService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

  public async authenticateUser(token: string): Promise<AuthenticatedUser | null> {
    try {
      // For demo purposes, if token is 'demo', return demo user
      if (token === 'demo') {
        return {
          id: 'demo-user',
          username: 'demo_user',
          email: 'demo@example.com',
          balance: 1000,
          avatar: ''
        };
      }

      // Verify JWT token
      const decoded = jwt.verify(token, this.JWT_SECRET) as any;
      
      // Find user in database
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user || !user.isActive) {
        return null;
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        balance: user.balance,
        avatar: user.avatar || undefined
      };

    } catch (error) {
      console.error('Authentication error:', error);
      return null;
    }
  }

  public async createUser(userData: {
    username: string;
    email: string;
    password: string;
  }): Promise<{ success: boolean; user?: AuthenticatedUser; message?: string }> {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: userData.email },
            { username: userData.username }
          ]
        }
      });

      if (existingUser) {
        return {
          success: false,
          message: 'User with this email or username already exists'
        };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      // Create new user
      const user = await prisma.user.create({
        data: {
          username: userData.username,
          email: userData.email,
          password: hashedPassword
        }
      });

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          balance: user.balance,
          avatar: user.avatar || undefined
        }
      };

    } catch (error) {
      console.error('Error creating user:', error);
      return {
        success: false,
        message: 'Failed to create user'
      };
    }
  }

  public async loginUser(credentials: {
    email: string;
    password: string;
  }): Promise<{ success: boolean; token?: string; user?: AuthenticatedUser; message?: string }> {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: credentials.email }
      });

      if (!user || !user.isActive) {
        return {
          success: false,
          message: 'Invalid credentials'
        };
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Invalid credentials'
        };
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id },
        this.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });

      return {
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          balance: user.balance,
          avatar: user.avatar || undefined
        }
      };

    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Login failed'
      };
    }
  }

  public async updateBalance(userId: string, amount: number): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return false;
      }

      const newBalance = Math.max(0, user.balance + amount);

      await prisma.user.update({
        where: { id: userId },
        data: { balance: newBalance }
      });

      return true;

    } catch (error) {
      console.error('Error updating balance:', error);
      return false;
    }
  }

  public async getUserBalance(userId: string): Promise<number | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { balance: true }
      });

      return user ? user.balance : null;
    } catch (error) {
      console.error('Error getting user balance:', error);
      return null;
    }
  }

  public async getUserBetHistory(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const history = await prisma.betHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit
      });

      return history.map(bet => ({
        _id: bet.id,
        name: bet.username,
        betAmount: bet.betAmount,
        cashoutAt: bet.cashoutAt || 0,
        cashouted: bet.cashouted,
        date: bet.createdAt
      }));

    } catch (error) {
      console.error('Error getting user bet history:', error);
      return [];
    }
  }
}