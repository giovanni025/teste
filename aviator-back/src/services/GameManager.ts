import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../config/database';
import { ProvablyFair } from '../utils/ProvablyFair';

export interface GameState {
  currentNum: number;
  currentSecondNum: number;
  GameState: 'BET' | 'PLAYING' | 'GAMEEND';
  time: number;
  roundId: string;
  crashPoint?: number;
  bettingTimeLeft?: number;
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
  private bettingInterval: NodeJS.Timeout | null = null;
  private currentRoundId: string = '';
  private crashPoint: number = 1.00;
  private gameStartTime: number = 0;
  private bettingStartTime: number = 0;
  private provablyFair: ProvablyFair;
  private isGameRunning: boolean = false;

  // Game configuration
  private readonly BETTING_DURATION = 5000; // 5 seconds betting phase
  private readonly MIN_BET = parseFloat(process.env.MIN_BET || '1');
  private readonly MAX_BET = parseFloat(process.env.MAX_BET || '1000');
  private readonly UPDATE_INTERVAL = 50; // 50ms for smooth updates

  constructor(io: Server) {
    this.io = io;
    this.provablyFair = new ProvablyFair();
    this.gameState = {
      currentNum: 1.00,
      currentSecondNum: 1.00,
      GameState: 'BET',
      time: Date.now(),
      roundId: '',
      bettingTimeLeft: this.BETTING_DURATION
    };
  }

  public startGameLoop(): void {
    console.log('🎮 Starting Aviator Game Loop...');
    this.startBettingPhase();
  }

  private startBettingPhase(): void {
    this.currentRoundId = uuidv4();
    this.currentBets.clear();
    this.bettingStartTime = Date.now();
    
    // Generate crash point for this round using provably fair
    this.crashPoint = this.provablyFair.generateCrashPoint();
    
    this.gameState = {
      currentNum: 1.00,
      currentSecondNum: 1.00,
      GameState: 'BET',
      time: this.bettingStartTime,
      roundId: this.currentRoundId,
      bettingTimeLeft: this.BETTING_DURATION
    };

    console.log(`🎲 New round: ${this.currentRoundId.slice(0, 8)}, Crash: ${this.crashPoint.toFixed(2)}x`);

    // Broadcast initial game state
    this.io.to('game-room').emit('gameState', this.gameState);
    this.io.to('game-room').emit('bettedUserInfo', []);

    // Start betting countdown
    this.startBettingCountdown();

    // Start playing phase after betting duration
    setTimeout(() => {
      this.startPlayingPhase();
    }, this.BETTING_DURATION);
  }

  private startBettingCountdown(): void {
    this.bettingInterval = setInterval(() => {
      const elapsed = Date.now() - this.bettingStartTime;
      const timeLeft = Math.max(0, this.BETTING_DURATION - elapsed);
      
      this.gameState.bettingTimeLeft = timeLeft;
      this.gameState.time = Date.now();
      
      // Broadcast betting countdown
      this.io.to('game-room').emit('gameState', this.gameState);
      
      if (timeLeft <= 0) {
        if (this.bettingInterval) {
          clearInterval(this.bettingInterval);
          this.bettingInterval = null;
        }
      }
    }, 100); // Update every 100ms
  }

  private startPlayingPhase(): void {
    if (this.bettingInterval) {
      clearInterval(this.bettingInterval);
      this.bettingInterval = null;
    }

    this.gameStartTime = Date.now();
    this.isGameRunning = true;
    
    this.gameState = {
      currentNum: 1.00,
      currentSecondNum: 1.00,
      GameState: 'PLAYING',
      time: this.gameStartTime,
      roundId: this.currentRoundId,
      crashPoint: this.crashPoint
    };

    console.log(`🚀 Playing phase started - Target crash: ${this.crashPoint.toFixed(2)}x`);

    // Broadcast playing state
    this.io.to('game-room').emit('gameState', this.gameState);

    // Start multiplier update loop
    this.gameInterval = setInterval(() => {
      this.updateMultiplier();
    }, this.UPDATE_INTERVAL);
  }

  private updateMultiplier(): void {
    if (!this.isGameRunning) return;

    const currentTime = Date.now();
    const elapsedTime = (currentTime - this.gameStartTime) / 1000;
    
    // Calculate current multiplier using smooth exponential growth
    let currentMultiplier = this.calculateMultiplier(elapsedTime);
    
    // Ensure minimum multiplier
    currentMultiplier = Math.max(1.00, currentMultiplier);

    this.gameState.currentNum = currentMultiplier;
    this.gameState.currentSecondNum = currentMultiplier;
    this.gameState.time = currentTime;

    // Check if we should crash
    if (currentMultiplier >= this.crashPoint) {
      this.endGame();
      return;
    }

    // Check for auto cashouts
    this.checkAutoCashouts(currentMultiplier);

    // Broadcast updated multiplier to all clients
    this.io.to('game-room').emit('gameState', this.gameState);
  }

  private calculateMultiplier(timeInSeconds: number): number {
    // Smooth exponential growth formula for realistic flight curve
    const base = 1.0;
    const growthRate = 0.1; // Adjust for speed of growth
    const acceleration = 0.02; // Acceleration factor
    
    return base + (growthRate * timeInSeconds) + (acceleration * Math.pow(timeInSeconds, 1.5));
  }

  private checkAutoCashouts(currentMultiplier: number): void {
    for (const [key, bet] of this.currentBets) {
      if (!bet.cashouted && bet.target <= currentMultiplier) {
        this.processCashOut(bet, currentMultiplier);
        
        // Notify specific user about auto cashout
        this.io.to(bet.socketId).emit('success', `Auto cash out at ${currentMultiplier.toFixed(2)}x!`);
      }
    }
  }

  private async endGame(): Promise<void> {
    this.isGameRunning = false;
    
    if (this.gameInterval) {
      clearInterval(this.gameInterval);
      this.gameInterval = null;
    }

    this.gameState = {
      currentNum: this.crashPoint,
      currentSecondNum: this.crashPoint,
      GameState: 'GAMEEND',
      time: Date.now(),
      roundId: this.currentRoundId,
      crashPoint: this.crashPoint
    };

    console.log(`💥 Game ended - Crashed at ${this.crashPoint.toFixed(2)}x`);

    // Broadcast final game state
    this.io.to('game-room').emit('gameState', this.gameState);

    // Process all remaining bets and save to database
    const finalResults = await this.processFinalResults();

    // Save game history
    await this.saveGameHistory();

    // Broadcast final results to all players
    this.broadcastFinalResults(finalResults);

    // Update and broadcast history
    await this.broadcastHistory();

    // Start next round after 3 seconds
    setTimeout(() => {
      this.startBettingPhase();
    }, 3000);
  }

  private async processFinalResults(): Promise<Map<string, any>> {
    const results = new Map();
    const socketResults = new Map();

    for (const [betKey, bet] of this.currentBets) {
      try {
        // Calculate win amount
        const winAmount = bet.cashouted ? bet.cashOut : 0;
        const profit = winAmount - bet.betAmount;

        // Save bet history to database
        await prisma.betHistory.create({
          data: {
            userId: bet.userId,
            username: bet.name,
            roundId: this.currentRoundId,
            betAmount: bet.betAmount,
            cashoutAt: bet.cashouted ? bet.target : undefined,
            winAmount: winAmount,
            cashouted: bet.cashouted,
            betType: bet.betType,
            isAuto: bet.isAuto,
            target: bet.target
          }
        });

        // Group results by socket ID
        if (!socketResults.has(bet.socketId)) {
          socketResults.set(bet.socketId, {
            f: { betted: false, cashouted: false, betAmount: 0, cashAmount: 0, target: 2, auto: false },
            s: { betted: false, cashouted: false, betAmount: 0, cashAmount: 0, target: 2, auto: false },
            balance: 1000,
            userType: true,
            userName: bet.name,
            img: bet.img
          });
        }

        const userResult = socketResults.get(bet.socketId);
        userResult[bet.betType] = {
          betted: false,
          cashouted: bet.cashouted,
          betAmount: bet.betAmount,
          cashAmount: profit,
          target: bet.target,
          auto: bet.isAuto
        };

        results.set(bet.socketId, userResult);

      } catch (error) {
        console.error('Error processing final result for bet:', error);
      }
    }

    return results;
  }

  private broadcastFinalResults(results: Map<string, any>): void {
    // Send individual results to each player
    for (const [socketId, result] of results) {
      this.io.to(socketId).emit('finishGame', result);
    }

    // Broadcast updated bet list (now empty for next round)
    this.io.to('game-room').emit('bettedUserInfo', []);
  }

  private async saveGameHistory(): Promise<void> {
    try {
      const totalBets = Array.from(this.currentBets.values()).reduce((sum, bet) => sum + bet.betAmount, 0);
      const totalWinnings = Array.from(this.currentBets.values())
        .filter(bet => bet.cashouted)
        .reduce((sum, bet) => sum + bet.cashOut, 0);

      await prisma.gameHistory.create({
        data: {
          roundId: this.currentRoundId,
          crashPoint: this.crashPoint,
          startTime: new Date(this.gameStartTime),
          endTime: new Date(),
          totalBets,
          totalWinnings,
          playerCount: this.currentBets.size,
          seed: this.provablyFair.getCurrentSeed()
        }
      });

      console.log(`📊 Game history saved - Round: ${this.currentRoundId.slice(0, 8)}`);

    } catch (error) {
      console.error('Error saving game history:', error);
    }
  }

  private async broadcastHistory(): Promise<void> {
    try {
      const history = await prisma.gameHistory.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: { crashPoint: true }
      });
      
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

      // Validate betting phase
      if (this.gameState.GameState !== 'BET') {
        return { success: false, message: 'Betting phase has ended' };
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
      
      console.log(`💰 Bet placed: ${data.username} - ${data.betAmount} INR (${data.type}) - Target: ${data.target}x`);
      
      // Broadcast updated bets immediately
      this.io.to('game-room').emit('bettedUserInfo', this.getCurrentBets());
      
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

      // Use current multiplier for manual cashout
      const currentMultiplier = this.gameState.currentNum;
      const winAmount = this.processCashOut(bet, currentMultiplier);
      
      console.log(`💸 Manual cash out: ${bet.name} - ${winAmount.toFixed(2)} INR at ${currentMultiplier.toFixed(2)}x`);
      
      return { success: true, winAmount };

    } catch (error) {
      console.error('Error cashing out:', error);
      return { success: false, message: 'Failed to cash out' };
    }
  }

  private processCashOut(bet: BettedUser, multiplier: number): number {
    bet.cashouted = true;
    bet.cashOut = bet.betAmount * multiplier;
    bet.target = multiplier; // Update target to actual cashout multiplier
    
    // Update the bet in the map
    const betKey = `${bet.socketId}_${bet.betType}`;
    this.currentBets.set(betKey, bet);
    
    // Broadcast updated bets immediately
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

  // Method to get current round info for debugging
  public getCurrentRoundInfo(): any {
    return {
      roundId: this.currentRoundId,
      gameState: this.gameState.GameState,
      crashPoint: this.crashPoint,
      currentMultiplier: this.gameState.currentNum,
      activeBets: this.currentBets.size,
      isGameRunning: this.isGameRunning
    };
  }
}