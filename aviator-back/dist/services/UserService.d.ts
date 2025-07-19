export interface AuthenticatedUser {
    id: string;
    username: string;
    email: string;
    balance: number;
    avatar?: string;
}
export declare class UserService {
    private readonly JWT_SECRET;
    authenticateUser(token: string): Promise<AuthenticatedUser | null>;
    createUser(userData: {
        username: string;
        email: string;
        password: string;
    }): Promise<{
        success: boolean;
        user?: AuthenticatedUser;
        message?: string;
    }>;
    loginUser(credentials: {
        email: string;
        password: string;
    }): Promise<{
        success: boolean;
        token?: string;
        user?: AuthenticatedUser;
        message?: string;
    }>;
    updateBalance(userId: string, amount: number): Promise<boolean>;
    getUserBalance(userId: string): Promise<number | null>;
    getUserBetHistory(userId: string, limit?: number): Promise<any[]>;
}
//# sourceMappingURL=UserService.d.ts.map