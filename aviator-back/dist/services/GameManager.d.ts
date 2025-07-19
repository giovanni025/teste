import { Server } from 'socket.io';
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
export declare class GameManager {
    private io;
    private gameState;
    private currentBets;
    private gameInterval;
    private bettingInterval;
    private currentRoundId;
    private crashPoint;
    private gameStartTime;
    private bettingStartTime;
    private provablyFair;
    private isGameRunning;
    private readonly BETTING_DURATION;
    private readonly MIN_BET;
    private readonly MAX_BET;
    private readonly UPDATE_INTERVAL;
    constructor(io: Server);
    startGameLoop(): void;
    private startBettingPhase;
    private startBettingCountdown;
    private startPlayingPhase;
    private updateMultiplier;
    private calculateMultiplier;
    private checkAutoCashouts;
    private endGame;
    private processFinalResults;
    private broadcastFinalResults;
    private saveGameHistory;
    private broadcastHistory;
    validateBet(betAmount: number, userBalance: number): {
        valid: boolean;
        message?: string;
    };
    placeBet(data: PlaceBetData): Promise<{
        success: boolean;
        message?: string;
    }>;
    cashOut(data: CashOutData): Promise<{
        success: boolean;
        message?: string;
        winAmount?: number;
    }>;
    private processCashOut;
    getCurrentBets(): BettedUser[];
    getCurrentGameState(): GameState;
    getBetLimits(): {
        min: number;
        max: number;
    };
    removeUserBets(socketId: string): void;
    getCurrentRoundInfo(): any;
}
//# sourceMappingURL=GameManager.d.ts.map