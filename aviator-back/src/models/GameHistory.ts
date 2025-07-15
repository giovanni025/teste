import mongoose, { Document, Schema } from 'mongoose';

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

const GameHistorySchema = new Schema<IGameHistory>({
  roundId: {
    type: String,
    required: true,
    unique: true
  },
  crashPoint: {
    type: Number,
    required: true,
    min: 1.00
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  totalBets: {
    type: Number,
    default: 0,
    min: 0
  },
  totalWinnings: {
    type: Number,
    default: 0,
    min: 0
  },
  playerCount: {
    type: Number,
    default: 0,
    min: 0
  },
  seed: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
GameHistorySchema.index({ createdAt: -1 });
GameHistorySchema.index({ roundId: 1 });

export const GameHistory = mongoose.model<IGameHistory>('GameHistory', GameHistorySchema);