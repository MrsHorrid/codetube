import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import * as progressService from '../services/progressService';

const router = Router({ mergeParams: true });

// Validation schemas
const updateProgressSchema = z.object({
  recordingId: z.string().uuid().optional(),
  timestampMs: z.number().min(0),
  eventIndex: z.number().min(0),
  lastCheckpointId: z.string().uuid().optional(),
  playbackSpeed: z.number().min(0.5).max(4).optional(),
});

// PUT /api/tutorials/:id/progress - Update progress
router.put('/:id/progress', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const validated = updateProgressSchema.parse(req.body);
    const progress = await progressService.updateProgress(
      req.user!.userId,
      req.params.id as string,
      validated
    );
    res.json({
      success: true,
      data: { progress },
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
      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: { code: 'UPDATE_ERROR', message: error.message },
      });
      return;
    }
    next(error);
  }
});

// POST /api/tutorials/:id/progress/complete - Mark complete
router.post('/:id/progress/complete', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const progress = await progressService.markComplete(
      req.user!.userId,
      req.params.id as string
    );
    res.json({
      success: true,
      data: {
        completedAt: progress.completedAt,
        watchTimeSec: progress.watchTimeSec,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      const statusCode = error.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: { code: 'COMPLETE_ERROR', message: error.message },
      });
      return;
    }
    next(error);
  }
});

// GET /api/me/progress - Get all user progress
router.get('/', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const progress = await progressService.getUserProgress(req.user!.userId);
    res.json({
      success: true,
      data: { progress },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
