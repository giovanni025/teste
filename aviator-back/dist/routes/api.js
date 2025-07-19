"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const UserService_1 = require("../services/UserService");
const HistoryService_1 = require("../services/HistoryService");
const auth_1 = require("../middleware/auth");
const database_1 = require("../config/database");
const router = express_1.default.Router();
const userService = new UserService_1.UserService();
const historyService = new HistoryService_1.HistoryService();
router.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'Aviator Backend API',
        database: 'SQLite'
    });
});
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
        }
        else {
            res.status(400).json({ error: result.message });
        }
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
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
        }
        else {
            res.status(401).json({ error: result.message });
        }
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/profile', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        res.json({
            user: req.user
        });
    }
    catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/my-info', auth_1.optionalAuth, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({
                error: 'Username is required',
                status: false
            });
        }
        const history = await userService.getUserBetHistory(req.user?.id || 'demo-user', 50);
        res.json({
            status: true,
            data: history
        });
    }
    catch (error) {
        console.error('My info error:', error);
        res.status(500).json({
            error: 'Internal server error',
            status: false
        });
    }
});
router.get('/get-day-history', async (req, res) => {
    try {
        const history = await historyService.getDayHistory();
        res.json({
            status: true,
            data: history
        });
    }
    catch (error) {
        console.error('Day history error:', error);
        res.status(500).json({
            error: 'Internal server error',
            status: false,
            data: []
        });
    }
});
router.get('/get-month-history', async (req, res) => {
    try {
        const history = await historyService.getMonthHistory();
        res.json({
            status: true,
            data: history
        });
    }
    catch (error) {
        console.error('Month history error:', error);
        res.status(500).json({
            error: 'Internal server error',
            status: false,
            data: []
        });
    }
});
router.get('/get-year-history', async (req, res) => {
    try {
        const history = await historyService.getYearHistory();
        res.json({
            status: true,
            data: history
        });
    }
    catch (error) {
        console.error('Year history error:', error);
        res.status(500).json({
            error: 'Internal server error',
            status: false,
            data: []
        });
    }
});
router.post('/update-balance', auth_1.authenticateToken, async (req, res) => {
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
        }
        else {
            res.status(400).json({ error: 'Failed to update balance' });
        }
    }
    catch (error) {
        console.error('Update balance error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
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
    }
    catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({
            error: 'Internal server error',
            status: false
        });
    }
});
router.get('/db-info', async (req, res) => {
    try {
        const userCount = await database_1.prisma.user.count();
        const gameCount = await database_1.prisma.gameHistory.count();
        const betCount = await database_1.prisma.betHistory.count();
        res.json({
            status: true,
            data: {
                database: 'SQLite',
                users: userCount,
                games: gameCount,
                bets: betCount
            }
        });
    }
    catch (error) {
        console.error('DB info error:', error);
        res.status(500).json({
            error: 'Internal server error',
            status: false
        });
    }
});
exports.default = router;
//# sourceMappingURL=api.js.map