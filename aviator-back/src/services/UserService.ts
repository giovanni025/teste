import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';

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
      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        return null;
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      return {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        balance: user.balance,
        avatar: user.avatar
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
      const existingUser = await User.findOne({
        $or: [
          { email: userData.email },
          { username: userData.username }
        ]
      });

      if (existingUser) {
        return {
          success: false,
          message: 'User with this email or username already exists'
        };
      }

      // Create new user
      const user = new User(userData);
      await user.save();

      return {
        success: true,
        user: {
          id: user._id.toString(),
          username: user.username,
          email: user.email,
          balance: user.balance,
          avatar: user.avatar
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
      const user = await User.findOne({ email: credentials.email });
      if (!user || !user.isActive) {
        return {
          success: false,
          message: 'Invalid credentials'
        };
      }

      // Check password
      const isPasswordValid = await user.comparePassword(credentials.password);
      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Invalid credentials'
        };
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id },
        this.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      return {
        success: true,
        token,
        user: {
          id: user._id.toString(),
          username: user.username,
          email: user.email,
          balance: user.balance,
          avatar: user.avatar
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
      const user = await User.findById(userId);
      if (!user) {
        return false;
      }

      user.balance += amount;
      
      // Ensure balance doesn't go negative
      if (user.balance < 0) {
        user.balance = 0;
      }

      await user.save();
      return true;

    } catch (error) {
      console.error('Error updating balance:', error);
      return false;
    }
  }

  public async getUserBalance(userId: string): Promise<number | null> {
    try {
      const user = await User.findById(userId);
      return user ? user.balance : null;
    } catch (error) {
      console.error('Error getting user balance:', error);
      return null;
    }
  }

  public async getUserBetHistory(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const { BetHistory } = await import('../models/BetHistory');
      
      const history = await BetHistory.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return history.map(bet => ({
        _id: bet._id,
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