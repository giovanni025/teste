import { Document } from 'mongoose';
export interface IGameHistory extends Document {
    roundId: string;
    crashPoint: number;
    startTime: Date;
    endTime: Date;
    totalBets: number;
    totalWinnings: number;
    playerCount: number;
    seed: string;
    createdAt: Date;
}
export declare const GameHistory: any;
//# sourceMappingURL=GameHistory.d.ts.map