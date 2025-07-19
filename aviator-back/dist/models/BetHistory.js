"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.BetHistory = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const BetHistorySchema = new mongoose_1.Schema({
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
BetHistorySchema.index({ userId: 1, createdAt: -1 });
BetHistorySchema.index({ roundId: 1 });
BetHistorySchema.index({ username: 1, createdAt: -1 });
exports.BetHistory = mongoose_1.default.model('BetHistory', BetHistorySchema);
//# sourceMappingURL=BetHistory.js.map