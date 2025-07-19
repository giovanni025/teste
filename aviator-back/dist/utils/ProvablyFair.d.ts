export declare class ProvablyFair {
    private currentSeed;
    private nonce;
    constructor();
    private generateSeed;
    generateCrashPoint(): number;
    getCurrentSeed(): string;
    getCurrentNonce(): number;
    verifyCrashPoint(seed: string, nonce: number, crashPoint: number): boolean;
    generateNewSeed(): void;
}
//# sourceMappingURL=ProvablyFair.d.ts.map