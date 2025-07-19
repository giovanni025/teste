export declare class HistoryService {
    getRecentHistory(limit?: number): Promise<number[]>;
    getDayHistory(): Promise<any[]>;
    getMonthHistory(): Promise<any[]>;
    getYearHistory(): Promise<any[]>;
    getUserBetHistory(username: string): Promise<any[]>;
}
//# sourceMappingURL=HistoryService.d.ts.map