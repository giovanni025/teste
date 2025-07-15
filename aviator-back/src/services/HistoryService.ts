import { prisma } from '../config/database';

export class HistoryService {
  public async getRecentHistory(limit: number = 50): Promise<number[]> {
    try {
      const history = await prisma.gameHistory.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: { crashPoint: true }
      });
      
      return history.map(h => h.crashPoint);
    } catch (error) {
      console.error('Error getting recent history:', error);
      return [];
    }
  }

  public async getDayHistory(): Promise<any[]> {
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const topBets = await prisma.betHistory.findMany({
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

    } catch (error) {
      console.error('Error getting day history:', error);
      return [];
    }
  }

  public async getMonthHistory(): Promise<any[]> {
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const topBets = await prisma.betHistory.findMany({
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

    } catch (error) {
      console.error('Error getting month history:', error);
      return [];
    }
  }

  public async getYearHistory(): Promise<any[]> {
    try {
      const startOfYear = new Date();
      startOfYear.setMonth(0, 1);
      startOfYear.setHours(0, 0, 0, 0);

      const topBets = await prisma.betHistory.findMany({
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

    } catch (error) {
      console.error('Error getting year history:', error);
      return [];
    }
  }

  public async getUserBetHistory(username: string): Promise<any[]> {
    try {
      const history = await prisma.betHistory.findMany({
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

    } catch (error) {
      console.error('Error getting user bet history:', error);
      return [];
    }
  }
}