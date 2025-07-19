"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./config/database");
const GameManager_1 = require("./services/GameManager");
const UserService_1 = require("./services/UserService");
const HistoryService_1 = require("./services/HistoryService");
const api_1 = __importDefault(require("./routes/api"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
    }
});
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/api', api_1.default);
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        database: 'SQLite'
    });
});
const gameManager = new GameManager_1.GameManager(io);
const userService = new UserService_1.UserService();
const historyService = new HistoryService_1.HistoryService();
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    socket.on('enterRoom', async (data) => {
        try {
            const { token } = data;
            let user = null;
            if (token) {
                user = await userService.authenticateUser(token);
                if (user) {
                    socket.data.user = user;
                    socket.data.authenticated = true;
                }
            }
            socket.join('game-room');
            const gameState = gameManager.getCurrentGameState();
            const history = await historyService.getRecentHistory(50);
            const bettedUsers = gameManager.getCurrentBets();
            const betLimits = gameManager.getBetLimits();
            socket.emit('gameState', gameState);
            socket.emit('history', history);
            socket.emit('bettedUserInfo', bettedUsers);
            socket.emit('getBetLimits', betLimits);
            if (user) {
                socket.emit('myInfo', {
                    balance: user.balance,
                    userType: true,
                    userName: user.username,
                    img: user.avatar || ''
                });
            }
            else {
                socket.emit('myInfo', {
                    balance: 1000,
                    userType: false,
                    userName: 'demo_user',
                    img: ''
                });
            }
        }
        catch (error) {
            console.error('Error in enterRoom:', error);
            socket.emit('error', { message: 'Failed to join room' });
        }
    });
    socket.on('playBet', async (data) => {
        try {
            const { betAmount, target, type, auto } = data;
            const user = socket.data.user;
            const userId = user?.id || socket.id;
            const username = user?.username || 'demo_user';
            const userBalance = user?.balance || 1000;
            const validation = gameManager.validateBet(betAmount, userBalance);
            if (!validation.valid) {
                socket.emit('error', { message: validation.message, index: type });
                return;
            }
            const bet = await gameManager.placeBet({
                userId,
                username,
                avatar: user?.avatar || '/avatars/av-5.png',
                betAmount,
                target,
                type,
                auto,
                socketId: socket.id
            });
            if (bet.success) {
                if (user) {
                    await userService.updateBalance(user.id, -betAmount);
                    user.balance -= betAmount;
                }
                socket.emit('myBetState', {
                    f: { betted: type === 'f' },
                    s: { betted: type === 's' }
                });
                socket.emit('success', 'Bet placed successfully!');
            }
            else {
                socket.emit('error', { message: bet.message, index: type });
            }
        }
        catch (error) {
            console.error('Error in playBet:', error);
            socket.emit('error', { message: 'Failed to place bet', index: data.type });
        }
    });
    socket.on('cashOut', async (data) => {
        try {
            const { type, endTarget } = data;
            const user = socket.data.user;
            const userId = user?.id || socket.id;
            const result = await gameManager.cashOut({
                userId,
                type,
                multiplier: endTarget,
                socketId: socket.id
            });
            if (result.success) {
                if (user) {
                    await userService.updateBalance(user.id, result.winAmount);
                    user.balance += result.winAmount;
                }
                socket.emit('success', `Cashed out at ${endTarget}x!`);
            }
            else {
                socket.emit('error', { message: result.message, index: type });
            }
        }
        catch (error) {
            console.error('Error in cashOut:', error);
            socket.emit('error', { message: 'Failed to cash out', index: data.type });
        }
    });
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        gameManager.removeUserBets(socket.id);
    });
});
gameManager.startGameLoop();
const PORT = process.env.PORT || 3001;
(0, database_1.connectDatabase)().then(async () => {
    await database_1.prisma.$executeRaw `PRAGMA foreign_keys = ON`;
    server.listen(PORT, () => {
        console.log(`🚀 Aviator Backend Server running on port ${PORT}`);
        console.log(`🎮 Game loop started`);
        console.log(`📊 Database: SQLite`);
        console.log(`📁 Database file: aviator-back/prisma/dev.db`);
        console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
}).catch((error) => {
    console.error('Failed to connect to database:', error);
    process.exit(1);
});
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await database_1.prisma.$disconnect();
    server.close(() => {
        console.log('Process terminated');
    });
});
process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    await database_1.prisma.$disconnect();
    server.close(() => {
        console.log('Process terminated');
    });
});
//# sourceMappingURL=server.js.map