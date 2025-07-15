import crypto from 'crypto';

export class ProvablyFair {
  private currentSeed: string;
  private nonce: number = 0;

  constructor() {
    this.currentSeed = this.generateSeed();
  }

  private generateSeed(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  public generateCrashPoint(): number {
    // Increment nonce for each game
    this.nonce++;

    // Create hash using seed and nonce
    const hash = crypto
      .createHmac('sha256', this.currentSeed)
      .update(this.nonce.toString())
      .digest('hex');

    // Convert first 8 characters of hash to number
    const hashNumber = parseInt(hash.substring(0, 8), 16);
    
    // Calculate crash point using house edge of 3%
    const houseEdge = 0.03;
    const maxValue = 0xFFFFFFFF; // 2^32 - 1
    
    // If the hash results in a crash at 1.00x (house wins immediately)
    if (hashNumber < maxValue * houseEdge) {
      return 1.00;
    }

    // Calculate crash point with exponential distribution
    const crashPoint = Math.floor((maxValue / (maxValue - hashNumber)) * 100) / 100;
    
    // Ensure minimum crash point of 1.00 and maximum of 1000.00
    return Math.max(1.00, Math.min(1000.00, crashPoint));
  }

  public getCurrentSeed(): string {
    return this.currentSeed;
  }

  public getCurrentNonce(): number {
    return this.nonce;
  }

  public verifyCrashPoint(seed: string, nonce: number, crashPoint: number): boolean {
    try {
      const hash = crypto
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

    } catch (error) {
      console.error('Error verifying crash point:', error);
      return false;
    }
  }

  public generateNewSeed(): void {
    this.currentSeed = this.generateSeed();
    this.nonce = 0;
  }
}