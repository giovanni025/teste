import express from 'express';
import { UserService } from '../services/UserService';
import { HistoryService } from '../services/HistoryService';
import { authenticateToken, optionalAuth, AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../config/database';

const router = express.Router();
const userService = new UserService();
const historyService = new HistoryService();

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Aviator Backend API',
    database: 'SQLite'
  });
});

// User registration
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ 
        error: 'Username, email, and password are required' 
      });
    }

    const result = await userService.createUser({ username, email, password });

    if (result.success) {
      res.status(201).json({
        message: 'User created successfully',
        user: result.user
      });
    } else {
      res.status(400).json({ error: result.message });
    }

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    const result = await userService.loginUser({ email, password });

    if (result.success) {
      res.json({
        message: 'Login successful',
        token: result.token,
        user: result.user
      });
    } else {
      res.status(401).json({ error: result.message });
    }

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile (protected)
router.get('/profile', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    res.json({
      user: req.user
    });

  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user bet history
router.post('/my-info', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ 
        error: 'Username is required',
        status: false 
      });
    }

    const history = await userService.getUserBetHistory(
      req.user?.id || 'demo-user',
      50
    );

    res.json({
      status: true,
      data: history
    });

  } catch (error) {
    console.error('My info error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      status: false 
    });
  }
});

// Get day history
router.get('/get-day-history', async (req, res) => {
  try {
    const history = await historyService.getDayHistory();
    
    res.json({
      status: true,
      data: history
    });

  } catch (error) {
    console.error('Day history error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      status: false,
      data: []
    });
  }
});

// Get month history
router.get('/get-month-history', async (req, res) => {
  try {
    const history = await historyService.getMonthHistory();
    
    res.json({
      status: true,
      data: history
    });

  } catch (error) {
    console.error('Month history error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      status: false,
      data: []
    });
  }
});

// Get year history
router.get('/get-year-history', async (req, res) => {
  try {
    const history = await historyService.getYearHistory();
    
    res.json({
      status: true,
      data: history
    });

  } catch (error) {
    console.error('Year history error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      status: false,
      data: []
    });
  }
});

// Update user balance (protected)
router.post('/update-balance', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { amount } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (typeof amount !== 'number') {
      return res.status(400).json({ error: 'Amount must be a number' });
    }

    const success = await userService.updateBalance(req.user.id, amount);

    if (success) {
      const newBalance = await userService.getUserBalance(req.user.id);
      res.json({
        message: 'Balance updated successfully',
        balance: newBalance
      });
    } else {
      res.status(400).json({ error: 'Failed to update balance' });
    }

  } catch (error) {
    console.error('Update balance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get game statistics
router.get('/stats', async (req, res) => {
  try {
    const recentHistory = await historyService.getRecentHistory(100);
    
    const stats = {
      totalGames: recentHistory.length,
      averageCrashPoint: recentHistory.length > 0 
        ? recentHistory.reduce((sum, point) => sum + point, 0) / recentHistory.length 
        : 0,
      highestCrashPoint: recentHistory.length > 0 ? Math.max(...recentHistory) : 0,
      lowestCrashPoint: recentHistory.length > 0 ? Math.min(...recentHistory) : 0
    };

    res.json({
      status: true,
      data: stats
    });

  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      status: false 
    });
  }
});

// Database info endpoint
router.get('/db-info', async (req, res) => {
  try {
    const userCount = await prisma.user.count();
    const gameCount = await prisma.gameHistory.count();
    const betCount = await prisma.betHistory.count();

    res.json({
      status: true,
      data: {
        database: 'SQLite',
        users: userCount,
        games: gameCount,
        bets: betCount
      }
    });

  } catch (error) {
    console.error('DB info error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      status: false 
    });
  }
});

export default router;