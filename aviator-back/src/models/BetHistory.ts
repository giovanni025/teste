import mongoose, { Document, Schema } from 'mongoose';

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

const BetHistorySchema = new Schema<IBetHistory>({
  userId: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  roundId: {
    type: String,
    required: true
  },
  betAmount: {
    type: Number,
    required: true,
    min: 0.01
  },
  cashoutAt: {
    type: Number,
    min: 1.00
  },
  winAmount: {
    type: Number,
    min: 0,
    default: 0
  },
  cashouted: {
    type: Boolean,
    default: false
  },
  betType: {
    type: String,
    enum: ['f', 's'],
    required: true
  },
  isAuto: {
    type: Boolean,
    default: false
  },
  target: {
    type: Number,
    required: true,
    min: 1.01
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
BetHistorySchema.index({ userId: 1, createdAt: -1 });
BetHistorySchema.index({ roundId: 1 });
BetHistorySchema.index({ username: 1, createdAt: -1 });

export const BetHistory = mongoose.model<IBetHistory>('BetHistory', BetHistorySchema);