"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProvablyFair = void 0;
const crypto_1 = __importDefault(require("crypto"));
class ProvablyFair {
    constructor() {
        this.nonce = 0;
        this.currentSeed = this.generateSeed();
    }
    generateSeed() {
        return crypto_1.default.randomBytes(32).toString('hex');
    }
    generateCrashPoint() {
        this.nonce++;
        const hash = crypto_1.default
            .createHmac('sha256', this.currentSeed)
            .update(this.nonce.toString())
            .digest('hex');
        const hashNumber = parseInt(hash.substring(0, 8), 16);
        const houseEdge = 0.03;
        const maxValue = 0xFFFFFFFF;
        if (hashNumber < maxValue * houseEdge) {
            return 1.00;
        }
        const crashPoint = Math.floor((maxValue / (maxValue - hashNumber)) * 100) / 100;
        return Math.max(1.00, Math.min(1000.00, crashPoint));
    }
    getCurrentSeed() {
        return this.currentSeed;
    }
    getCurrentNonce() {
        return this.nonce;
    }
    verifyCrashPoint(seed, nonce, crashPoint) {
        try {
            const hash = crypto_1.default
                .createHmac('sha256', seed)
                .update(nonce.toString())
                .digest('hex');
            const hashNumber = parseInt(hash.substring(0, 8), 16);
            const houseEdge = 0.03;
            const maxValue = 0xFFFFFFFF;
            if (hashNumber < maxValue * houseEdge) {
                return crashPoint === 1.00;
            }
            const expectedCrashPoint = Math.floor((maxValue / (maxValue - hashNumber)) * 100) / 100;
            const verifiedCrashPoint = Math.max(1.00, Math.min(1000.00, expectedCrashPoint));
            return Math.abs(verifiedCrashPoint - crashPoint) < 0.01;
        }
        catch (error) {
            console.error('Error verifying crash point:', error);
            return false;
        }
    }
    generateNewSeed() {
        this.currentSeed = this.generateSeed();
        this.nonce = 0;
    }
}
exports.ProvablyFair = ProvablyFair;
//# sourceMappingURL=ProvablyFair.js.map