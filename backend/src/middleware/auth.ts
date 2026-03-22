import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { JWT_CONFIG } from '../utils/config';
import { TokenPayload } from '../types';

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export const generateTokens = (payload: TokenPayload): { accessToken: string; refreshToken: string } => {
  const accessToken = jwt.sign(payload, JWT_CONFIG.secret as Secret, { expiresIn: JWT_CONFIG.expiresIn as SignOptions['expiresIn'] });
  const refreshToken = jwt.sign(payload, JWT_CONFIG.refreshSecret as Secret, { expiresIn: JWT_CONFIG.refreshExpiresIn as SignOptions['expiresIn'] });
  
  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_CONFIG.secret as Secret) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_CONFIG.refreshSecret as Secret) as TokenPayload;
};

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'No token provided' },
      });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' },
    });
  }
};

export const optionalAuthMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyAccessToken(token);
      req.user = decoded;
    }
    next();
  } catch {
    // If token is invalid, continue without user
    next();
  }
};
