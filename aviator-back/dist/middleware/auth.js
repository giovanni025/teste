"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authenticateSocket = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            res.status(401).json({ error: 'Access token required' });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const user = await database_1.prisma.user.findUnique({
            where: { id: decoded.userId }
        });
        if (!user || !user.isActive) {
            res.status(403).json({ error: 'Invalid or expired token' });
            return;
        }
        req.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            balance: user.balance
        };
        next();
    }
    catch (error) {
        console.error('Authentication error:', error);
        res.status(403).json({ error: 'Invalid or expired token' });
    }
};
exports.authenticateToken = authenticateToken;
const authenticateSocket = async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        if (!token) {
            socket.data.authenticated = false;
            return next();
        }
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const user = await database_1.prisma.user.findUnique({
            where: { id: decoded.userId }
        });
        if (!user || !user.isActive) {
            return next(new Error('Authentication failed'));
        }
        socket.data.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            balance: user.balance,
            avatar: user.avatar
        };
        socket.data.authenticated = true;
        next();
    }
    catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
    }
};
exports.authenticateSocket = authenticateSocket;
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (token) {
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            const user = await database_1.prisma.user.findUnique({
                where: { id: decoded.userId }
            });
            if (user && user.isActive) {
                req.user = {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    balance: user.balance
                };
            }
        }
        next();
    }
    catch (error) {
        next();
    }
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.js.map