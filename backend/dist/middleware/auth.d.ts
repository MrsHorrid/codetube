import { Request, Response, NextFunction } from 'express';
import { TokenPayload } from '../types';
export interface AuthRequest extends Request {
    user?: TokenPayload;
}
export declare const generateTokens: (payload: TokenPayload) => {
    accessToken: string;
    refreshToken: string;
};
export declare const verifyAccessToken: (token: string) => TokenPayload;
export declare const verifyRefreshToken: (token: string) => TokenPayload;
export declare const authMiddleware: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const optionalAuthMiddleware: (req: AuthRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map