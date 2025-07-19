"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistoryService = void 0;
const database_1 = require("../config/database");
class HistoryService {
    async getRecentHistory(limit = 50) {
        try {
            const history = await database_1.prisma.gameHistory.findMany({
                orderBy: { createdAt: 'desc' },
                take: limit,
                select: { crashPoint: true }
            });
            return history.map(h => h.crashPoint);
        }
        catch (error) {
            console.error('Error getting recent history:', error);
            return [];
        }
    }
    async getDayHistory() {
        try {
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);
            const topBets = await database_1.prisma.betHistory.findMany({
                where: {
                    createdAt: { gte: startOfDay },
                    cashouted: true
                },
                orderBy: { winAmount: 'desc' },
                take: 10
            });
            return topBets.map(bet => ({
                betAmount: bet.betAmount,
                cashoutAt: bet.cashoutAt || 1,
                winAmount: bet.winAmount || 0
            }));
        }
        catch (error) {
            console.error('Error getting day history:', error);
            return [];
        }
    }
    async getMonthHistory() {
        try {
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);
            const topBets = await database_1.prisma.betHistory.findMany({
                where: {
                    createdAt: { gte: startOfMonth },
                    cashouted: true
                },
                orderBy: { winAmount: 'desc' },
                take: 10
            });
            return topBets.map(bet => ({
                betAmount: bet.betAmount,
                cashoutAt: bet.cashoutAt || 1,
                winAmount: bet.winAmount || 0
            }));
        }
        catch (error) {
            console.error('Error getting month history:', error);
            return [];
        }
    }
    async getYearHistory() {
        try {
            const startOfYear = new Date();
            startOfYear.setMonth(0, 1);
            startOfYear.setHours(0, 0, 0, 0);
            const topBets = await database_1.prisma.betHistory.findMany({
                where: {
                    createdAt: { gte: startOfYear },
                    cashouted: true
                },
                orderBy: { winAmount: 'desc' },
                take: 10
            });
            return topBets.map(bet => ({
                betAmount: bet.betAmount,
                cashoutAt: bet.cashoutAt || 1,
                winAmount: bet.winAmount || 0
            }));
        }
        catch (error) {
            console.error('Error getting year history:', error);
            return [];
        }
    }
    async getUserBetHistory(username) {
        try {
            const history = await database_1.prisma.betHistory.findMany({
                where: { username },
                orderBy: { createdAt: 'desc' },
                take: 50
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
exports.HistoryService = HistoryService;
//# sourceMappingURL=HistoryService.js.map