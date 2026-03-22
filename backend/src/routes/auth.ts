import { Router } from 'express';
import { z } from 'zod';
import { validateRequest } from '../middleware/validation';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import * as authService from '../services/authService';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// POST /api/auth/register
router.post(
  '/register',
  validateRequest({ body: registerSchema }),
  async (req, res, next) => {
    try {
      const result = await authService.registerUser(req.body);
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          error: { code: 'REGISTRATION_ERROR', message: error.message },
        });
        return;
      }
      next(error);
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  validateRequest({ body: loginSchema }),
  async (req, res, next) => {
    try {
      const result = await authService.loginUser(req.body);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(401).json({
          success: false,
          error: { code: 'AUTH_ERROR', message: error.message },
        });
        return;
      }
      next(error);
    }
  }
);

// GET /api/auth/me
router.get(
  '/me',
  authMiddleware,
  async (req: AuthRequest, res) => {
    res.json({
      success: true,
      data: { user: req.user },
    });
  }
);

export default router;
