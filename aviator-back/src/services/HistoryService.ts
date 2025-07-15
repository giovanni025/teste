import { GameHistory } from '../models/GameHistory';
import { BetHistory } from '../models/BetHistory';

export class HistoryService {
  public async getRecentHistory(limit: number = 50): Promise<number[]> {
    try {
      const history = await GameHistory.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('crashPoint');
      
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

      const topBets = await BetHistory.find({
        createdAt: { $gte: startOfDay },
        cashouted: true
      })
      .sort({ winAmount: -1 })
      .limit(10)
      .lean();

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

      const topBets = await BetHistory.find({
        createdAt: { $gte: startOfMonth },
        cashouted: true
      })
      .sort({ winAmount: -1 })
      .limit(10)
      .lean();

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

      const topBets = await BetHistory.find({
        createdAt: { $gte: startOfYear },
        cashouted: true
      })
      .sort({ winAmount: -1 })
      .limit(10)
      .lean();

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
      const history = await BetHistory.find({ username })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      return history.map(bet => ({
        _id: bet._id,
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