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
exports.forksRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const forkService = __importStar(require("../services/forkService"));
const router = (0, express_1.Router)({ mergeParams: true });
// Validation schemas
const createForkSchema = zod_1.z.object({
    checkpointId: zod_1.z.string().uuid().optional(),
    name: zod_1.z.string().min(1).max(255).optional(),
    notes: zod_1.z.string().optional(),
});
const updateForkSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(255).optional(),
    notes: zod_1.z.string().optional(),
    isPublic: zod_1.z.boolean().optional(),
});
// POST /api/tutorials/:id/forks - Create fork
router.post('/:id/forks', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const validated = createForkSchema.parse(req.body);
        const result = await forkService.createFork(req.user.userId, req.params.id, validated);
        res.status(201).json({
            success: true,
            data: result,
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
                error: { code: 'CREATE_ERROR', message: error.message },
            });
            return;
        }
        next(error);
    }
});
exports.default = router;
// GET /api/me/forks - List user forks
exports.forksRouter = (0, express_1.Router)();
exports.forksRouter.get('/', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const forks = await forkService.getUserForks(req.user.userId);
        res.json({
            success: true,
            data: { forks },
        });
    }
    catch (error) {
        next(error);
    }
});
// GET /api/forks/:id - Get fork by ID
exports.forksRouter.get('/:id', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const result = await forkService.getForkById(req.params.id, req.user.userId);
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
    }
    catch (error) {
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
exports.forksRouter.patch('/:id', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const validated = updateForkSchema.parse(req.body);
        const fork = await forkService.updateFork(req.params.id, req.user.userId, validated);
        res.json({
            success: true,
            data: { fork },
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
// DELETE /api/forks/:id - Delete fork
exports.forksRouter.delete('/:id', auth_1.authMiddleware, async (req, res, next) => {
    try {
        await forkService.deleteFork(req.params.id, req.user.userId);
        res.status(204).send();
    }
    catch (error) {
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
exports.forksRouter.get('/share/:token', async (req, res, next) => {
    try {
        const result = await forkService.getForkByShareToken(req.params.token);
        res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
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
//# sourceMappingURL=forks.js.map