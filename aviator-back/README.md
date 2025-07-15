# Aviator Backend Server 🚀

Backend server for the Aviator crash game built with Node.js, TypeScript, Socket.IO, and MongoDB.

## 📋 Features

- **Real-time Game Engine**: WebSocket-based multiplayer crash game
- **Provably Fair System**: Cryptographically secure random number generation
- **User Management**: Registration, authentication, and balance management
- **Game History**: Complete betting and game round history
- **RESTful API**: HTTP endpoints for data retrieval
- **MongoDB Integration**: Persistent data storage
- **TypeScript**: Full type safety and modern JavaScript features

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Real-time**: Socket.IO
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Encryption**: bcryptjs for password hashing
- **Environment**: dotenv for configuration

## 📦 Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd aviator-back
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:
```env
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/aviator-game
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d
MIN_BET=1
MAX_BET=1000
GAME_DURATION=5000
CRASH_PROBABILITY=0.03
FRONTEND_URL=http://localhost:3000
```

4. **Start MongoDB**
Make sure MongoDB is running on your system.

5. **Build and run**
```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

## 🎮 Game Logic

### Game Flow
1. **Betting Phase** (5 seconds): Players place bets
2. **Playing Phase**: Multiplier increases from 1.00x
3. **Crash**: Game ends at predetermined crash point
4. **Results**: Winners receive payouts, new round begins

### Provably Fair System
- Each round uses cryptographic hash functions
- Crash points are generated using HMAC-SHA256
- Players can verify game fairness using seed and nonce
- House edge: 3%

### Multiplier Calculation
```javascript
multiplier = 1 + 0.06 * time + (0.06 * time)² - (0.04 * time)³ + (0.04 * time)⁴
```

## 🔌 API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `GET /api/profile` - Get user profile (protected)

### Game Data
- `GET /api/health` - Health check
- `POST /api/my-info` - Get user bet history
- `GET /api/get-day-history` - Top wins today
- `GET /api/get-month-history` - Top wins this month
- `GET /api/get-year-history` - Top wins this year
- `GET /api/stats` - Game statistics

### User Management
- `POST /api/update-balance` - Update user balance (protected)

## 🔄 WebSocket Events

### Client → Server
- `enterRoom` - Join game room
- `playBet` - Place a bet
- `cashOut` - Cash out current bet

### Server → Client
- `gameState` - Current game state
- `bettedUserInfo` - Current round bets
- `history` - Recent crash points
- `myInfo` - User information
- `myBetState` - User bet status
- `finishGame` - Round results
- `getBetLimits` - Min/max bet amounts
- `error` - Error messages
- `success` - Success messages

## 📊 Database Schema

### Users
```typescript
{
  username: string;
  email: string;
  password: string; // hashed
  balance: number;
  avatar?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Game History
```typescript
{
  roundId: string;
  crashPoint: number;
  startTime: Date;
  endTime: Date;
  totalBets: number;
  totalWinnings: number;
  playerCount: number;
  seed: string;
  createdAt: Date;
}
```

### Bet History
```typescript
{
  userId: string;
  username: string;
  roundId: string;
  betAmount: number;
  cashoutAt?: number;
  winAmount?: number;
  cashouted: boolean;
  betType: 'f' | 's';
  isAuto: boolean;
  target: number;
  createdAt: Date;
}
```

## 🔧 Configuration

### Environment Variables
- `PORT`: Server port (default: 3001)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `MIN_BET`: Minimum bet amount
- `MAX_BET`: Maximum bet amount
- `GAME_DURATION`: Betting phase duration in ms
- `CRASH_PROBABILITY`: House edge probability
- `FRONTEND_URL`: Frontend URL for CORS

### Game Settings
- Betting phase: 5 seconds
- Update interval: 50ms
- Results delay: 3 seconds
- History limit: 50 rounds
- Auto-cashout support
- Dual betting (f/s types)

## 🚀 Deployment

### Production Setup
1. Set `NODE_ENV=production`
2. Use a process manager (PM2)
3. Set up MongoDB replica set
4. Configure reverse proxy (Nginx)
5. Enable SSL/TLS
6. Set up monitoring and logging

### Docker Support
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3001
CMD ["node", "dist/server.js"]
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## 📝 Development

### Project Structure
```
src/
├── config/          # Database and app configuration
├── models/          # MongoDB schemas
├── services/        # Business logic
├── routes/          # API routes
├── middleware/      # Express middleware
├── utils/           # Utility functions
└── server.ts        # Main server file
```

### Code Style
- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Conventional commits

## 🔒 Security

- Password hashing with bcrypt
- JWT token authentication
- Input validation and sanitization
- Rate limiting (recommended)
- CORS configuration
- Environment variable protection

## 📈 Monitoring

- Health check endpoint
- Error logging
- Performance metrics
- Database connection monitoring
- WebSocket connection tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- 🎮 Discord: `cashblaze127`
- 📱 Telegram: @cashblaze127
- 💼 LinkedIn: [Keyvel Bitcoin Solana](https://www.linkedin.com/in/keyvel-bitcoin-solana)

---

**Happy Gaming! 🎰**