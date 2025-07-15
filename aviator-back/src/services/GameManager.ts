import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { GameHistory } from '../models/GameHistory';
import { BetHistory } from '../models/BetHistory';
import { ProvablyFair } from '../utils/ProvablyFair';

export interface GameState {
  currentNum: number;
  currentSecondNum: number;
  GameState: 'BET' | 'PLAYING' | 'GAMEEND';
  time: number;
}

export interface BettedUser {
  name: string;
  betAmount: number;
  cashOut: number;
  cashouted: boolean;
  target: number;
  img: string;
  userId: string;
  socketId: string;
  betType: 'f' | 's';
  isAuto: boolean;
}

export interface PlaceBetData {
  userId: string;
  username: string;
  avatar: string;
  betAmount: number;
  target: number;
  type: 'f' | 's';
  auto: boolean;
  socketId: string;
}

export interface CashOutData {
  userId: string;
  type: 'f' | 's';
  multiplier: number;
  socketId: string;
}

export class GameManager {
  private io: Server;
  private gameState: GameState;
  private currentBets: Map<string, BettedUser> = new Map();
  private gameInterval: NodeJS.Timeout | null = null;
  private currentRoundId: string = '';
  private crashPoint: number = 1.00;
  private gameStartTime: number = 0;
  private provablyFair: ProvablyFair;

  // Game configuration
  private readonly GAME_DURATION = 5000; // 5 seconds betting phase
  private readonly MIN_BET = parseFloat(process.env.MIN_BET || '1');
  private readonly MAX_BET = parseFloat(process.env.MAX_BET || '1000');
  private readonly CRASH_PROBABILITY = parseFloat(process.env.CRASH_PROBABILITY || '0.03');

  constructor(io: Server) {
    this.io = io;
    this.provablyFair = new ProvablyFair();
    this.gameState = {
      currentNum: 1.00,
      currentSecondNum: 1.00,
      GameState: 'BET',
      time: Date.now()
    };
  }

  public startGameLoop(): void {
    this.startBettingPhase();
  }

  private startBettingPhase(): void {
    this.currentRoundId = uuidv4();
    this.currentBets.clear();
    
    // Generate crash point for this round
    this.crashPoint = this.provablyFair.generateCrashPoint();
    
    this.gameState = {
      currentNum: 1.00,
      currentSecondNum: 1.00,
      GameState: 'BET',
      time: Date.now()
    };

    console.log(`🎮 New round started: ${this.currentRoundId}, Crash point: ${this.crashPoint.toFixed(2)}x`);

    // Broadcast game state
    this.io.to('game-room').emit('gameState', this.gameState);

    // Start betting phase timer
    setTimeout(() => {
      this.startPlayingPhase();
    }, this.GAME_DURATION);
  }

  private startPlayingPhase(): void {
    this.gameStartTime = Date.now();
    
    this.gameState = {
      currentNum: 1.00,
      currentSecondNum: 1.00,
      GameState: 'PLAYING',
      time: this.gameStartTime
    };

    // Broadcast game state
    this.io.to('game-room').emit('gameState', this.gameState);

    // Start multiplier update loop
    this.gameInterval = setInterval(() => {
      this.updateMultiplier();
    }, 50); // Update every 50ms for smooth animation
  }

  private updateMultiplier(): void {
    const currentTime = Date.now();
    const elapsedTime = (currentTime - this.gameStartTime) / 1000;
    
    // Calculate current multiplier using exponential growth
    const currentMultiplier = 1 + 0.06 * elapsedTime + Math.pow(0.06 * elapsedTime, 2) 
                             - Math.pow(0.04 * elapsedTime, 3) + Math.pow(0.04 * elapsedTime, 4);

    this.gameState.currentNum = Math.max(1.00, currentMultiplier);
    this.gameState.currentSecondNum = this.gameState.currentNum;

    // Check if we should crash
    if (this.gameState.currentNum >= this.crashPoint) {
      this.endGame();
      return;
    }

    // Check for auto cashouts
    this.checkAutoCashouts();

    // Broadcast updated multiplier
    this.io.to('game-room').emit('gameState', this.gameState);
  }

  private checkAutoCashouts(): void {
    for (const [key, bet] of this.currentBets) {
      if (!bet.cashouted && bet.target <= this.gameState.currentNum) {
        this.processCashOut(bet, this.gameState.currentNum);
      }
    }
  }

  private async endGame(): Promise<void> {
    if (this.gameInterval) {
      clearInterval(this.gameInterval);
      this.gameInterval = null;
    }

    this.gameState = {
      currentNum: this.crashPoint,
      currentSecondNum: this.crashPoint,
      GameState: 'GAMEEND',
      time: Date.now()
    };

    // Broadcast final game state
    this.io.to('game-room').emit('gameState', this.gameState);

    // Process all remaining bets as losses
    const finalResults = await this.processFinalResults();

    // Save game history
    await this.saveGameHistory();

    // Broadcast final results to all players
    this.broadcastFinalResults(finalResults);

    // Start next round after 3 seconds
    setTimeout(() => {
      this.startBettingPhase();
    }, 3000);
  }

  private async processFinalResults(): Promise<Map<string, any>> {
    const results = new Map();

    for (const [socketId, bet] of this.currentBets) {
      try {
        // Save bet history
        await new BetHistory({
          userId: bet.userId,
          username: bet.name,
          roundId: this.currentRoundId,
          betAmount: bet.betAmount,
          cashoutAt: bet.cashouted ? bet.target : undefined,
          winAmount: bet.cashouted ? bet.cashOut : 0,
          cashouted: bet.cashouted,
          betType: bet.betType,
          isAuto: bet.isAuto,
          target: bet.target
        }).save();

        // Prepare result for user
        results.set(socketId, {
          f: bet.betType === 'f' ? {
            betted: false,
            cashouted: bet.cashouted,
            betAmount: bet.betAmount,
            cashAmount: bet.cashouted ? bet.cashOut - bet.betAmount : 0,
            target: bet.target,
            auto: bet.isAuto
          } : { betted: false, cashouted: false, betAmount: 0, cashAmount: 0, target: 2, auto: false },
          s: bet.betType === 's' ? {
            betted: false,
            cashouted: bet.cashouted,
            betAmount: bet.betAmount,
            cashAmount: bet.cashouted ? bet.cashOut - bet.betAmount : 0,
            target: bet.target,
            auto: bet.isAuto
          } : { betted: false, cashouted: false, betAmount: 0, cashAmount: 0, target: 2, auto: false },
          balance: 1000, // This should be updated with actual user balance
          userType: true,
          userName: bet.name,
          img: bet.img
        });

      } catch (error) {
        console.error('Error processing final result for bet:', error);
      }
    }

    return results;
  }

  private broadcastFinalResults(results: Map<string, any>): void {
    for (const [socketId, result] of results) {
      this.io.to(socketId).emit('finishGame', result);
    }

    // Broadcast updated history
    this.broadcastHistory();
  }

  private async saveGameHistory(): Promise<void> {
    try {
      const totalBets = Array.from(this.currentBets.values()).reduce((sum, bet) => sum + bet.betAmount, 0);
      const totalWinnings = Array.from(this.currentBets.values())
        .filter(bet => bet.cashouted)
        .reduce((sum, bet) => sum + bet.cashOut, 0);

      await new GameHistory({
        roundId: this.currentRoundId,
        crashPoint: this.crashPoint,
        startTime: new Date(this.gameStartTime),
        endTime: new Date(),
        totalBets,
        totalWinnings,
        playerCount: this.currentBets.size,
        seed: this.provablyFair.getCurrentSeed()
      }).save();

    } catch (error) {
      console.error('Error saving game history:', error);
    }
  }

  private async broadcastHistory(): Promise<void> {
    try {
      const history = await GameHistory.find()
        .sort({ createdAt: -1 })
        .limit(50)
        .select('crashPoint');
      
      const historyArray = history.map(h => h.crashPoint);
      this.io.to('game-room').emit('history', historyArray);
    } catch (error) {
      console.error('Error broadcasting history:', error);
    }
  }

  public validateBet(betAmount: number, userBalance: number): { valid: boolean; message?: string } {
    if (this.gameState.GameState !== 'BET') {
      return { valid: false, message: 'Betting phase has ended' };
    }

    if (betAmount < this.MIN_BET) {
      return { valid: false, message: `Minimum bet is ${this.MIN_BET}` };
    }

    if (betAmount > this.MAX_BET) {
      return { valid: false, message: `Maximum bet is ${this.MAX_BET}` };
    }

    if (betAmount > userBalance) {
      return { valid: false, message: 'Insufficient balance' };
    }

    return { valid: true };
  }

  public async placeBet(data: PlaceBetData): Promise<{ success: boolean; message?: string }> {
    try {
      const betKey = `${data.socketId}_${data.type}`;
      
      // Check if user already has a bet of this type
      if (this.currentBets.has(betKey)) {
        return { success: false, message: 'Bet already placed for this type' };
      }

      const bet: BettedUser = {
        name: data.username,
        betAmount: data.betAmount,
        cashOut: 0,
        cashouted: false,
        target: data.target,
        img: data.avatar,
        userId: data.userId,
        socketId: data.socketId,
        betType: data.type,
        isAuto: data.auto
      };

      this.currentBets.set(betKey, bet);
      
      console.log(`💰 Bet placed: ${data.username} - ${data.betAmount} (${data.type})`);
      
      return { success: true };

    } catch (error) {
      console.error('Error placing bet:', error);
      return { success: false, message: 'Failed to place bet' };
    }
  }

  public async cashOut(data: CashOutData): Promise<{ success: boolean; message?: string; winAmount?: number }> {
    try {
      const betKey = `${data.socketId}_${data.type}`;
      const bet = this.currentBets.get(betKey);

      if (!bet) {
        return { success: false, message: 'No active bet found' };
      }

      if (bet.cashouted) {
        return { success: false, message: 'Already cashed out' };
      }

      if (this.gameState.GameState !== 'PLAYING') {
        return { success: false, message: 'Cannot cash out at this time' };
      }

      const winAmount = this.processCashOut(bet, data.multiplier);
      
      console.log(`💸 Cash out: ${bet.name} - ${winAmount.toFixed(2)} at ${data.multiplier.toFixed(2)}x`);
      
      return { success: true, winAmount };

    } catch (error) {
      console.error('Error cashing out:', error);
      return { success: false, message: 'Failed to cash out' };
    }
  }

  private processCashOut(bet: BettedUser, multiplier: number): number {
    bet.cashouted = true;
    bet.cashOut = bet.betAmount * multiplier;
    
    // Update the bet in the map
    const betKey = `${bet.socketId}_${bet.betType}`;
    this.currentBets.set(betKey, bet);
    
    // Broadcast updated bets
    this.io.to('game-room').emit('bettedUserInfo', this.getCurrentBets());
    
    return bet.cashOut;
  }

  public getCurrentBets(): BettedUser[] {
    return Array.from(this.currentBets.values());
  }

  public getCurrentGameState(): GameState {
    return { ...this.gameState };
  }

  public getBetLimits(): { min: number; max: number } {
    return { min: this.MIN_BET, max: this.MAX_BET };
  }

  public removeUserBets(socketId: string): void {
    const keysToRemove = Array.from(this.currentBets.keys()).filter(key => key.startsWith(socketId));
    keysToRemove.forEach(key => this.currentBets.delete(key));
    
    if (keysToRemove.length > 0) {
      this.io.to('game-room').emit('bettedUserInfo', this.getCurrentBets());
    }
  }
}