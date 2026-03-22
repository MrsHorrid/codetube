"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const tutorialService = __importStar(require("../services/tutorialService"));
const router = (0, express_1.Router)();
// Validation schemas
const createTutorialSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(255),
    description: zod_1.z.string().optional(),
    language: zod_1.z.string().min(1).max(50),
    framework: zod_1.z.string().optional(),
    difficulty: zod_1.z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    isFree: zod_1.z.boolean().optional(),
});
const updateTutorialSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(255).optional(),
    description: zod_1.z.string().optional(),
    language: zod_1.z.string().min(1).max(50).optional(),
    framework: zod_1.z.string().optional(),
    difficulty: zod_1.z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    isFree: zod_1.z.boolean().optional(),
    status: zod_1.z.enum(['draft', 'processing', 'published', 'archived']).optional(),
});
const listTutorialsQuerySchema = zod_1.z.object({
    language: zod_1.z.string().optional(),
    difficulty: zod_1.z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
    tag: zod_1.z.string().optional(),
    status: zod_1.z.enum(['draft', 'processing', 'published', 'archived']).optional(),
    sort: zod_1.z.enum(['newest', 'popular', 'rating']).optional(),
    page: zod_1.z.string().transform(Number).optional(),
    limit: zod_1.z.string().transform(Number).optional(),
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
router.post('/', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const validated = createTutorialSchema.parse(req.body);
        const tutorial = await tutorialService.createTutorial(req.user.userId, validated);
        res.status(201).json({
            success: true,
            data: { tutorial },
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
router.get('/:id', auth_1.optionalAuthMiddleware, async (req, res, next) => {
    try {
        const tutorial = await tutorialService.getTutorialById(req.params.id, req.user?.userId);
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
    }
    catch (error) {
        next(error);
    }
});
// PATCH /api/tutorials/:id - Update tutorial
router.patch('/:id', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const validated = updateTutorialSchema.parse(req.body);
        const tutorial = await tutorialService.updateTutorial(req.params.id, req.user.userId, validated);
        res.json({
            success: true,
            data: { tutorial },
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
router.post('/:id/publish', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const tutorial = await tutorialService.updateTutorial(req.params.id, req.user.userId, { status: 'published' });
        res.json({
            success: true,
            data: { tutorial },
        });
    }
    catch (error) {
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
exports.default = router;
//# sourceMappingURL=tutorials.js.map