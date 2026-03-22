import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware, optionalAuthMiddleware, AuthRequest } from '../middleware/auth';
import * as tutorialService from '../services/tutorialService';

const router = Router();

// Validation schemas
const createTutorialSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  language: z.string().min(1).max(50),
  framework: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
  tags: z.array(z.string()).optional(),
  isFree: z.boolean().optional(),
});

const updateTutorialSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  language: z.string().min(1).max(50).optional(),
  framework: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
  tags: z.array(z.string()).optional(),
  isFree: z.boolean().optional(),
  status: z.enum(['draft', 'processing', 'published', 'archived']).optional(),
});

const listTutorialsQuerySchema = z.object({
  language: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
  tag: z.string().optional(),
  status: z.enum(['draft', 'processing', 'published', 'archived']).optional(),
  sort: z.enum(['newest', 'popular', 'rating']).optional(),
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
});

// GET /api/tutorials - List tutorials
router.get('/', async (req, res, next) => {
  try {
    const validated = listTutorialsQuerySchema.parse(req.query);
    const result = await tutorialService.listTutorials({
      language: validated.language,
      difficulty: validated.difficulty,
      tag: validated.tag,
      status: validated.status,
      sort: validated.sort,
      page: validated.page ? parseInt(String(validated.page), 10) : 1,
      limit: validated.limit ? parseInt(String(validated.limit), 10) : 20,
    });
    res.json({
      success: true,
      data: result.tutorials,
      meta: result.pagination,
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
    next(error);
  }
});

// POST /api/tutorials - Create tutorial
router.post('/', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const validated = createTutorialSchema.parse(req.body);
    const tutorial = await tutorialService.createTutorial(req.user!.userId, validated);
    res.status(201).json({
      success: true,
      data: { tutorial },
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
      res.status(400).json({
        success: false,
        error: { code: 'CREATE_ERROR', message: error.message },
      });
      return;
    }
    next(error);
  }
});

// GET /api/tutorials/:id - Get tutorial by ID
router.get('/:id', optionalAuthMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const tutorial = await tutorialService.getTutorialById(req.params.id as string, req.user?.userId);
    if (!tutorial) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Tutorial not found' },
      });
      return;
    }
    res.json({
      success: true,
      data: tutorial,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/tutorials/:id - Update tutorial
router.patch('/:id', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const validated = updateTutorialSchema.parse(req.body);
    const tutorial = await tutorialService.updateTutorial(
      req.params.id as string,
      req.user!.userId,
      validated
    );
    res.json({
      success: true,
      data: { tutorial },
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

// POST /api/tutorials/:id/publish - Publish tutorial
router.post('/:id/publish', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const tutorial = await tutorialService.updateTutorial(
      req.params.id as string,
      req.user!.userId,
      { status: 'published' }
    );
    res.json({
      success: true,
      data: { tutorial },
    });
  } catch (error) {
    if (error instanceof Error) {
      const statusCode = error.message.includes('not found') ? 404 : 403;
      res.status(statusCode).json({
        success: false,
        error: { code: 'PUBLISH_ERROR', message: error.message },
      });
      return;
    }
    next(error);
  }
});

export default router;
