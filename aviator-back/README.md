# Aviator Backend Server 🚀

Backend server for the Aviator crash game built with Node.js, TypeScript, Socket.IO, and SQLite.

## 📋 Features

- **Real-time Game Engine**: WebSocket-based multiplayer crash game
- **Provably Fair System**: Cryptographically secure random number generation
- **User Management**: Registration, authentication, and balance management
- **Game History**: Complete betting and game round history
- **RESTful API**: HTTP endpoints for data retrieval
- **SQLite Database**: Lightweight, file-based database (no server required)
- **TypeScript**: Full type safety and modern JavaScript features

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Real-time**: Socket.IO
- **Database**: SQLite with Prisma ORM
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

3. **Set up database**
```bash
# Generate Prisma client
npx prisma generate

# Create and migrate database
npx prisma db push

# Seed database with demo users (optional)
npm run db:seed
```

4. **Environment variables**
The `.env` file is already configured for SQLite:
```env
DATABASE_URL="file:./dev.db"
PORT=3001
JWT_SECRET=aviator-super-secret-jwt-key-2024-sqlite
```

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
- `GET /api/db-info` - Database information

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

## 📊 Database Schema (SQLite)

### Users
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  balance REAL DEFAULT 1000,
  avatar TEXT,
  isActive BOOLEAN DEFAULT true,
  lastLogin DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Game History
```sql
CREATE TABLE game_history (
  id TEXT PRIMARY KEY,
  roundId TEXT UNIQUE NOT NULL,
  crashPoint REAL NOT NULL,
  startTime DATETIME NOT NULL,
  endTime DATETIME NOT NULL,
  totalBets REAL DEFAULT 0,
  totalWinnings REAL DEFAULT 0,
  playerCount INTEGER DEFAULT 0,
  seed TEXT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Bet History
```sql
CREATE TABLE bet_history (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  username TEXT NOT NULL,
  roundId TEXT NOT NULL,
  betAmount REAL NOT NULL,
  cashoutAt REAL,
  winAmount REAL DEFAULT 0,
  cashouted BOOLEAN DEFAULT false,
  betType TEXT NOT NULL,
  isAuto BOOLEAN DEFAULT false,
  target REAL NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (roundId) REFERENCES game_history(roundId) ON DELETE CASCADE
);
```

## 🔧 Prisma Commands

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Create migration
npx prisma migrate dev --name init

# View database in browser
npx prisma studio

# Seed database
npm run db:seed

# Reset database
npx prisma migrate reset
```

## 🚀 Deployment

### Production Setup
1. Set `NODE_ENV=production`
2. Use a process manager (PM2)
3. Set up reverse proxy (Nginx)
4. Enable SSL/TLS
5. Set up monitoring and logging
6. Backup SQLite database regularly

### Docker Support
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
COPY prisma ./prisma
RUN npx prisma generate
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
├── config/          # Database configuration
├── services/        # Business logic
├── routes/          # API routes
├── middleware/      # Express middleware
├── utils/           # Utility functions
└── server.ts        # Main server file

prisma/
├── schema.prisma    # Database schema
├── seed.ts          # Database seeding
└── dev.db          # SQLite database file
```

### Demo Users
After running `npm run db:seed`:
- **Email**: demo@aviator.com **Password**: demo123
- **Email**: test@aviator.com **Password**: test123

## 🔒 Security

- Password hashing with bcrypt
- JWT token authentication
- Input validation and sanitization
- CORS configuration
- Environment variable protection
- SQLite file permissions

## 📈 Monitoring

- Health check endpoint
- Error logging
- Performance metrics
- Database connection monitoring
- WebSocket connection tracking

## 🗄️ Database Management

### Backup SQLite Database
```bash
# Create backup
cp prisma/dev.db prisma/backup-$(date +%Y%m%d).db

# Restore backup
cp prisma/backup-20241201.db prisma/dev.db
```

### View Database
```bash
# Open Prisma Studio
npx prisma studio

# Or use SQLite CLI
sqlite3 prisma/dev.db
```

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