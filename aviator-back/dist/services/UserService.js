"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
class UserService {
    constructor() {
        this.JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    }
    async authenticateUser(token) {
        try {
            if (token === 'demo') {
                return {
                    id: 'demo-user',
                    username: 'demo_user',
                    email: 'demo@example.com',
                    balance: 1000,
                    avatar: ''
                };
            }
            const decoded = jsonwebtoken_1.default.verify(token, this.JWT_SECRET);
            const user = await database_1.prisma.user.findUnique({
                where: { id: decoded.userId }
            });
            if (!user || !user.isActive) {
                return null;
            }
            await database_1.prisma.user.update({
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
        }
        catch (error) {
            console.error('Authentication error:', error);
            return null;
        }
    }
    async createUser(userData) {
        try {
            const existingUser = await database_1.prisma.user.findFirst({
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
            const hashedPassword = await bcryptjs_1.default.hash(userData.password, 12);
            const user = await database_1.prisma.user.create({
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
        }
        catch (error) {
            console.error('Error creating user:', error);
            return {
                success: false,
                message: 'Failed to create user'
            };
        }
    }
    async loginUser(credentials) {
        try {
            const user = await database_1.prisma.user.findUnique({
                where: { email: credentials.email }
            });
            if (!user || !user.isActive) {
                return {
                    success: false,
                    message: 'Invalid credentials'
                };
            }
            const isPasswordValid = await bcryptjs_1.default.compare(credentials.password, user.password);
            if (!isPasswordValid) {
                return {
                    success: false,
                    message: 'Invalid credentials'
                };
            }
            const token = jsonwebtoken_1.default.sign({ userId: user.id }, this.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
            await database_1.prisma.user.update({
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
        }
        catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: 'Login failed'
            };
        }
    }
    async updateBalance(userId, amount) {
        try {
            const user = await database_1.prisma.user.findUnique({
                where: { id: userId }
            });
            if (!user) {
                return false;
            }
            const newBalance = Math.max(0, user.balance + amount);
            await database_1.prisma.user.update({
                where: { id: userId },
                data: { balance: newBalance }
            });
            return true;
        }
        catch (error) {
            console.error('Error updating balance:', error);
            return false;
        }
    }
    async getUserBalance(userId) {
        try {
            const user = await database_1.prisma.user.findUnique({
                where: { id: userId },
                select: { balance: true }
            });
            return user ? user.balance : null;
        }
        catch (error) {
            console.error('Error getting user balance:', error);
            return null;
        }
    }
    async getUserBetHistory(userId, limit = 50) {
        try {
            const history = await database_1.prisma.betHistory.findMany({
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
        }
        catch (error) {
            console.error('Error getting user bet history:', error);
            return [];
        }
    }
}
exports.UserService = UserService;
//# sourceMappingURL=UserService.js.map