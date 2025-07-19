import { Document } from 'mongoose';
export interface IBetHistory extends Document {
    userId: string;
    username: string;
    roundId: string;
    betAmount: number;
    cashoutAt?: number;
    winAmount?: number;
    cashouted: boolean;
    betType: 'f' | 's';
    isAuto: boolean;
    target: number;
    createdAt: Date;
}
export declare const BetHistory: any;
//# sourceMappingURL=BetHistory.d.ts.map