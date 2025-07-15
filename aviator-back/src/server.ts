import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import { GameManager } from './services/GameManager';
import { UserService } from './services/UserService';
import { HistoryService } from './services/HistoryService';
import apiRoutes from './routes/api';
import { authenticateSocket } from './middleware/auth';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', apiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Initialize services
const gameManager = new GameManager(io);
const userService = new UserService();
const historyService = new HistoryService();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle room entry
  socket.on('enterRoom', async (data) => {
    try {
      const { token } = data;
      
      // Authenticate user if token provided
      let user = null;
      if (token) {
        user = await userService.authenticateUser(token);
        if (user) {
          socket.data.user = user;
          socket.data.authenticated = true;
        }
      }

      // Join game room
      socket.join('game-room');
      
      // Send initial game state
      const gameState = gameManager.getCurrentGameState();
      const history = await historyService.getRecentHistory(50);
      const bettedUsers = gameManager.getCurrentBets();
      const betLimits = gameManager.getBetLimits();

      socket.emit('gameState', gameState);
      socket.emit('history', history);
      socket.emit('bettedUserInfo', bettedUsers);
      socket.emit('getBetLimits', betLimits);

      // Send user info if authenticated
      if (user) {
        socket.emit('myInfo', {
          balance: user.balance,
          userType: true,
          userName: user.username,
          img: user.avatar || ''
        });
      } else {
        // Demo user
        socket.emit('myInfo', {
          balance: 1000,
          userType: false,
          userName: 'demo_user',
          img: ''
        });
      }

    } catch (error) {
      console.error('Error in enterRoom:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // Handle bet placement
  socket.on('playBet', async (data) => {
    try {
      const { betAmount, target, type, auto } = data;
      const user = socket.data.user;

      if (!user && socket.data.authenticated) {
        socket.emit('error', { message: 'Authentication required', index: type });
        return;
      }

      // Validate bet
      const validation = gameManager.validateBet(betAmount, user?.balance || 1000);
      if (!validation.valid) {
        socket.emit('error', { message: validation.message, index: type });
        return;
      }

      // Place bet
      const bet = await gameManager.placeBet({
        userId: user?.id || socket.id,
        username: user?.username || 'demo_user',
        avatar: user?.avatar || '',
        betAmount,
        target,
        type,
        auto,
        socketId: socket.id
      });

      if (bet.success) {
        // Update user balance if authenticated
        if (user) {
          await userService.updateBalance(user.id, -betAmount);
          user.balance -= betAmount;
        }

        // Emit bet confirmation
        socket.emit('myBetState', {
          f: { betted: type === 'f' },
          s: { betted: type === 's' }
        });

        // Broadcast updated bets to all users
        io.to('game-room').emit('bettedUserInfo', gameManager.getCurrentBets());
        
        socket.emit('success', 'Bet placed successfully!');
      } else {
        socket.emit('error', { message: bet.message, index: type });
      }

    } catch (error) {
      console.error('Error in playBet:', error);
      socket.emit('error', { message: 'Failed to place bet', index: data.type });
    }
  });

  // Handle cash out
  socket.on('cashOut', async (data) => {
    try {
      const { type, endTarget } = data;
      const user = socket.data.user;

      const result = await gameManager.cashOut({
        userId: user?.id || socket.id,
        type,
        multiplier: endTarget,
        socketId: socket.id
      });

      if (result.success) {
        // Update user balance if authenticated
        if (user) {
          await userService.updateBalance(user.id, result.winAmount);
          user.balance += result.winAmount;
        }

        // Broadcast updated bets
        io.to('game-room').emit('bettedUserInfo', gameManager.getCurrentBets());
        
        socket.emit('success', `Cashed out at ${endTarget}x!`);
      } else {
        socket.emit('error', { message: result.message, index: type });
      }

    } catch (error) {
      console.error('Error in cashOut:', error);
      socket.emit('error', { message: 'Failed to cash out', index: data.type });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    gameManager.removeUserBets(socket.id);
  });
});

// Start game loop
gameManager.startGameLoop();

// Connect to database and start server
const PORT = process.env.PORT || 3001;

connectDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Aviator Backend Server running on port ${PORT}`);
    console.log(`🎮 Game loop started`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}).catch((error) => {
  console.error('Failed to connect to database:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});