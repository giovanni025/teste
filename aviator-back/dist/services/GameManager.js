"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameManager = void 0;
const uuid_1 = require("uuid");
const database_1 = require("../config/database");
const ProvablyFair_1 = require("../utils/ProvablyFair");
class GameManager {
    constructor(io) {
        this.currentBets = new Map();
        this.gameInterval = null;
        this.bettingInterval = null;
        this.currentRoundId = '';
        this.crashPoint = 1.00;
        this.gameStartTime = 0;
        this.bettingStartTime = 0;
        this.isGameRunning = false;
        this.BETTING_DURATION = 5000;
        this.MIN_BET = parseFloat(process.env.MIN_BET || '1');
        this.MAX_BET = parseFloat(process.env.MAX_BET || '1000');
        this.UPDATE_INTERVAL = 50;
        this.io = io;
        this.provablyFair = new ProvablyFair_1.ProvablyFair();
        this.gameState = {
            currentNum: 1.00,
            currentSecondNum: 1.00,
            GameState: 'BET',
            time: Date.now(),
            roundId: '',
            bettingTimeLeft: this.BETTING_DURATION
        };
    }
    startGameLoop() {
        console.log('🎮 Starting Aviator Game Loop...');
        this.startBettingPhase();
    }
    startBettingPhase() {
        this.currentRoundId = (0, uuid_1.v4)();
        this.currentBets.clear();
        this.bettingStartTime = Date.now();
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
        this.io.to('game-room').emit('gameState', this.gameState);
        this.io.to('game-room').emit('bettedUserInfo', []);
        this.startBettingCountdown();
        setTimeout(() => {
            this.startPlayingPhase();
        }, this.BETTING_DURATION);
    }
    startBettingCountdown() {
        this.bettingInterval = setInterval(() => {
            const elapsed = Date.now() - this.bettingStartTime;
            const timeLeft = Math.max(0, this.BETTING_DURATION - elapsed);
            this.gameState.bettingTimeLeft = timeLeft;
            this.gameState.time = Date.now();
            this.io.to('game-room').emit('gameState', this.gameState);
            if (timeLeft <= 0) {
                if (this.bettingInterval) {
                    clearInterval(this.bettingInterval);
                    this.bettingInterval = null;
                }
            }
        }, 100);
    }
    startPlayingPhase() {
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
        this.io.to('game-room').emit('gameState', this.gameState);
        this.gameInterval = setInterval(() => {
            this.updateMultiplier();
        }, this.UPDATE_INTERVAL);
    }
    updateMultiplier() {
        if (!this.isGameRunning)
            return;
        const currentTime = Date.now();
        const elapsedTime = (currentTime - this.gameStartTime) / 1000;
        let currentMultiplier = this.calculateMultiplier(elapsedTime);
        currentMultiplier = Math.max(1.00, currentMultiplier);
        this.gameState.currentNum = currentMultiplier;
        this.gameState.currentSecondNum = currentMultiplier;
        this.gameState.time = currentTime;
        if (currentMultiplier >= this.crashPoint) {
            this.endGame();
            return;
        }
        this.checkAutoCashouts(currentMultiplier);
        this.io.to('game-room').emit('gameState', this.gameState);
    }
    calculateMultiplier(timeInSeconds) {
        const base = 1.0;
        const growthRate = 0.1;
        const acceleration = 0.02;
        return base + (growthRate * timeInSeconds) + (acceleration * Math.pow(timeInSeconds, 1.5));
    }
    checkAutoCashouts(currentMultiplier) {
        for (const [key, bet] of this.currentBets) {
            if (!bet.cashouted && bet.target <= currentMultiplier) {
                this.processCashOut(bet, currentMultiplier);
                this.io.to(bet.socketId).emit('success', `Auto cash out at ${currentMultiplier.toFixed(2)}x!`);
            }
        }
    }
    async endGame() {
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
        this.io.to('game-room').emit('gameState', this.gameState);
        const finalResults = await this.processFinalResults();
        await this.saveGameHistory();
        this.broadcastFinalResults(finalResults);
        await this.broadcastHistory();
        setTimeout(() => {
            this.startBettingPhase();
        }, 3000);
    }
    async processFinalResults() {
        const results = new Map();
        const socketResults = new Map();
        for (const [betKey, bet] of this.currentBets) {
            try {
                const winAmount = bet.cashouted ? bet.cashOut : 0;
                const profit = winAmount - bet.betAmount;
                await database_1.prisma.betHistory.create({
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
            }
            catch (error) {
                console.error('Error processing final result for bet:', error);
            }
        }
        return results;
    }
    broadcastFinalResults(results) {
        for (const [socketId, result] of results) {
            this.io.to(socketId).emit('finishGame', result);
        }
        this.io.to('game-room').emit('bettedUserInfo', []);
    }
    async saveGameHistory() {
        try {
            const totalBets = Array.from(this.currentBets.values()).reduce((sum, bet) => sum + bet.betAmount, 0);
            const totalWinnings = Array.from(this.currentBets.values())
                .filter(bet => bet.cashouted)
                .reduce((sum, bet) => sum + bet.cashOut, 0);
            await database_1.prisma.gameHistory.create({
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
        }
        catch (error) {
            console.error('Error saving game history:', error);
        }
    }
    async broadcastHistory() {
        try {
            const history = await database_1.prisma.gameHistory.findMany({
                orderBy: { createdAt: 'desc' },
                take: 50,
                select: { crashPoint: true }
            });
            const historyArray = history.map(h => h.crashPoint);
            this.io.to('game-room').emit('history', historyArray);
        }
        catch (error) {
            console.error('Error broadcasting history:', error);
        }
    }
    validateBet(betAmount, userBalance) {
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
    async placeBet(data) {
        try {
            const betKey = `${data.socketId}_${data.type}`;
            if (this.currentBets.has(betKey)) {
                return { success: false, message: 'Bet already placed for this type' };
            }
            if (this.gameState.GameState !== 'BET') {
                return { success: false, message: 'Betting phase has ended' };
            }
            const bet = {
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
            this.io.to('game-room').emit('bettedUserInfo', this.getCurrentBets());
            return { success: true };
        }
        catch (error) {
            console.error('Error placing bet:', error);
            return { success: false, message: 'Failed to place bet' };
        }
    }
    async cashOut(data) {
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
            const currentMultiplier = this.gameState.currentNum;
            const winAmount = this.processCashOut(bet, currentMultiplier);
            console.log(`💸 Manual cash out: ${bet.name} - ${winAmount.toFixed(2)} INR at ${currentMultiplier.toFixed(2)}x`);
            return { success: true, winAmount };
        }
        catch (error) {
            console.error('Error cashing out:', error);
            return { success: false, message: 'Failed to cash out' };
        }
    }
    processCashOut(bet, multiplier) {
        bet.cashouted = true;
        bet.cashOut = bet.betAmount * multiplier;
        bet.target = multiplier;
        const betKey = `${bet.socketId}_${bet.betType}`;
        this.currentBets.set(betKey, bet);
        this.io.to('game-room').emit('bettedUserInfo', this.getCurrentBets());
        return bet.cashOut;
    }
    getCurrentBets() {
        return Array.from(this.currentBets.values());
    }
    getCurrentGameState() {
        return { ...this.gameState };
    }
    getBetLimits() {
        return { min: this.MIN_BET, max: this.MAX_BET };
    }
    removeUserBets(socketId) {
        const keysToRemove = Array.from(this.currentBets.keys()).filter(key => key.startsWith(socketId));
        keysToRemove.forEach(key => this.currentBets.delete(key));
        if (keysToRemove.length > 0) {
            this.io.to('game-room').emit('bettedUserInfo', this.getCurrentBets());
        }
    }
    getCurrentRoundInfo() {
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
exports.GameManager = GameManager;
//# sourceMappingURL=GameManager.js.map