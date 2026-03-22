import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import * as recordingService from '../services/recordingService';

const router = Router({ mergeParams: true });

// Validation schemas
const createRecordingSchema = z.object({
  tutorialId: z.string().uuid(),
  partIndex: z.number().optional(),
  title: z.string().optional(),
  durationSec: z.number().positive(),
  eventCount: z.number().positive(),
  sizeBytes: z.number().positive(),
  checksumSha256: z.string().length(64),
  compression: z.enum(['gzip', 'zstd', 'none']).optional(),
  encoding: z.enum(['json', 'msgpack', 'binary']).optional(),
  editor: z.string().optional(),
  terminalCols: z.number().optional(),
  terminalRows: z.number().optional(),
});

const createCheckpointSchema = z.object({
  timestampMs: z.number().positive(),
  eventIndex: z.number().positive(),
  label: z.string().min(1),
  description: z.string().optional(),
  stateSnapshot: z.object({}).passthrough().optional(),
});

// POST /api/recordings - Create recording
router.post('/', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const validated = createRecordingSchema.parse(req.body);
    const result = await recordingService.createRecording(req.user!.userId, validated);
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

// GET /api/recordings/:id - Get recording metadata
router.get('/:id', (req, res, next) => authMiddleware(req as AuthRequest, res, next), async (req, res, next) => {
  try {
    const result = await recordingService.getRecordingById(req.params.id as string);
    if (!result) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Recording not found' },
      });
      return;
    }
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/recordings/:id/stream - Stream recording data
router.get('/:id/stream', async (req, res, next) => {
  try {
    const result = await recordingService.getRecordingData(req.params.id as string);
    
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Length', result.size);
    res.setHeader('X-Recording-Duration', result.data.length);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    res.send(result.data);
  } catch (error) {
    if (error instanceof Error) {
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: { code: 'STREAM_ERROR', message: error.message },
      });
      return;
    }
    next(error);
  }
});

// POST /api/recordings/:id/confirm - Confirm upload
router.post('/:id/confirm', (req, res, next) => authMiddleware(req as AuthRequest, res, next), async (req: AuthRequest, res, next) => {
  try {
    const result = await recordingService.confirmRecordingUpload(
      req.params.id as string,
      req.user!.userId
    );
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof Error) {
      const statusCode = error.message.includes('not found') ? 404 : 403;
      res.status(statusCode).json({
        success: false,
        error: { code: 'CONFIRM_ERROR', message: error.message },
      });
      return;
    }
    next(error);
  }
});

// GET /api/recordings/:id/checkpoints - List checkpoints
router.get('/:id/checkpoints', async (req, res, next) => {
  try {
    const checkpoints = await recordingService.getRecordingCheckpoints(req.params.id as string);
    res.json({
      success: true,
      data: { checkpoints },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/recordings/:id/checkpoints - Create checkpoint
router.post('/:id/checkpoints', (req, res, next) => authMiddleware(req as AuthRequest, res, next), async (req: AuthRequest, res, next) => {
  try {
    const validated = createCheckpointSchema.parse(req.body);
    const checkpoint = await recordingService.createCheckpoint(
      req.params.id as string,
      req.user!.userId,
      validated
    );
    res.status(201).json({
      success: true,
      data: { checkpoint },
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
