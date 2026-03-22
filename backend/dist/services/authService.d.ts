export interface RegisterInput {
    username: string;
    email: string;
    password: string;
    displayName?: string;
}
export interface LoginInput {
    email: string;
    password: string;
}
export interface AuthResponse {
    user: {
        id: string;
        username: string;
        email: string;
        displayName: string | null;
        isCreator: boolean;
        isVerified: boolean;
    };
    accessToken: string;
    refreshToken: string;
}
export declare const registerUser: (input: RegisterInput) => Promise<AuthResponse>;
export declare const loginUser: (input: LoginInput) => Promise<AuthResponse>;
//# sourceMappingURL=authService.d.ts.map