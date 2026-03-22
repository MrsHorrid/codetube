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
const progressService = __importStar(require("../services/progressService"));
const router = (0, express_1.Router)({ mergeParams: true });
// Validation schemas
const updateProgressSchema = zod_1.z.object({
    recordingId: zod_1.z.string().uuid().optional(),
    timestampMs: zod_1.z.number().min(0),
    eventIndex: zod_1.z.number().min(0),
    lastCheckpointId: zod_1.z.string().uuid().optional(),
    playbackSpeed: zod_1.z.number().min(0.5).max(4).optional(),
});
// PUT /api/tutorials/:id/progress - Update progress
router.put('/:id/progress', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const validated = updateProgressSchema.parse(req.body);
        const progress = await progressService.updateProgress(req.user.userId, req.params.id, validated);
        res.json({
            success: true,
            data: { progress },
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
router.post('/:id/progress/complete', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const progress = await progressService.markComplete(req.user.userId, req.params.id);
        res.json({
            success: true,
            data: {
                completedAt: progress.completedAt,
                watchTimeSec: progress.watchTimeSec,
            },
        });
    }
    catch (error) {
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
router.get('/', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const progress = await progressService.getUserProgress(req.user.userId);
        res.json({
            success: true,
            data: { progress },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=progress.js.map