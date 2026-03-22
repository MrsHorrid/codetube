import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import * as forkService from '../services/forkService';

const router = Router({ mergeParams: true });

// Validation schemas
const createForkSchema = z.object({
  checkpointId: z.string().uuid().optional(),
  name: z.string().min(1).max(255).optional(),
  notes: z.string().optional(),
});

const updateForkSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  notes: z.string().optional(),
  isPublic: z.boolean().optional(),
});

// POST /api/tutorials/:id/forks - Create fork
router.post('/:id/forks', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const validated = createForkSchema.parse(req.body);
    const result = await forkService.createFork(
      req.user!.userId,
      req.params.id as string,
      validated
    );
    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
      });
      return;
    }
    if (error instanceof Error) {
      const statusCode = error.message.includes('not found') ? 404 : 403;
      res.status(statusCode).json({
        success: false,
        error: { code: 'CREATE_ERROR', message: error.message },
      });
      return;
    }
    next(error);
  }
});

export default router;

// GET /api/me/forks - List user forks
export const forksRouter = Router();

forksRouter.get('/', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const forks = await forkService.getUserForks(req.user!.userId);
    res.json({
      success: true,
      data: { forks },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/forks/:id - Get fork by ID
forksRouter.get('/:id', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const result = await forkService.getForkById(req.params.id as string, req.user!.userId);
    if (!result) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Fork not found' },
      });
      return;
    }
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(error.message === 'Unauthorized' ? 403 : 404).json({
        success: false,
        error: { code: 'FORBIDDEN', message: error.message },
      });
      return;
    }
    next(error);
  }
});

// PATCH /api/forks/:id - Update fork
forksRouter.patch('/:id', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const validated = updateForkSchema.parse(req.body);
    const fork = await forkService.updateFork(
      req.params.id as string,
      req.user!.userId,
      validated
    );
    res.json({
      success: true,
      data: { fork },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
      });
      return;
    }
    if (error instanceof Error) {
      const statusCode = error.message.includes('not found') ? 404 : 403;
      res.status(statusCode).json({
        success: false,
        error: { code: 'UPDATE_ERROR', message: error.message },
      });
      return;
    }
    next(error);
  }
});

// DELETE /api/forks/:id - Delete fork
forksRouter.delete('/:id', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    await forkService.deleteFork(req.params.id as string, req.user!.userId);
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error) {
      const statusCode = error.message.includes('not found') ? 404 : 403;
      res.status(statusCode).json({
        success: false,
        error: { code: 'DELETE_ERROR', message: error.message },
      });
      return;
    }
    next(error);
  }
});

// GET /api/forks/share/:token - Get fork by share token (public)
forksRouter.get('/share/:token', async (req, res, next) => {
  try {
    const result = await forkService.getForkByShareToken(req.params.token);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: error.message },
      });
      return;
    }
    next(error);
  }
});
