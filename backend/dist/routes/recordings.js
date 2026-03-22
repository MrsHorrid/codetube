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
const recordingService = __importStar(require("../services/recordingService"));
const router = (0, express_1.Router)({ mergeParams: true });
// Validation schemas
const createRecordingSchema = zod_1.z.object({
    tutorialId: zod_1.z.string().uuid(),
    partIndex: zod_1.z.number().optional(),
    title: zod_1.z.string().optional(),
    durationSec: zod_1.z.number().positive(),
    eventCount: zod_1.z.number().positive(),
    sizeBytes: zod_1.z.number().positive(),
    checksumSha256: zod_1.z.string().length(64),
    compression: zod_1.z.enum(['gzip', 'zstd', 'none']).optional(),
    encoding: zod_1.z.enum(['json', 'msgpack', 'binary']).optional(),
    editor: zod_1.z.string().optional(),
    terminalCols: zod_1.z.number().optional(),
    terminalRows: zod_1.z.number().optional(),
});
const createCheckpointSchema = zod_1.z.object({
    timestampMs: zod_1.z.number().positive(),
    eventIndex: zod_1.z.number().positive(),
    label: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    stateSnapshot: zod_1.z.object({}).passthrough().optional(),
});
// POST /api/recordings - Create recording
router.post('/', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const validated = createRecordingSchema.parse(req.body);
        const result = await recordingService.createRecording(req.user.userId, validated);
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
// GET /api/recordings/:id - Get recording metadata
router.get('/:id', (req, res, next) => (0, auth_1.authMiddleware)(req, res, next), async (req, res, next) => {
    try {
        const result = await recordingService.getRecordingById(req.params.id);
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
    }
    catch (error) {
        next(error);
    }
});
// GET /api/recordings/:id/stream - Stream recording data
router.get('/:id/stream', async (req, res, next) => {
    try {
        const result = await recordingService.getRecordingData(req.params.id);
        res.setHeader('Content-Type', result.contentType);
        res.setHeader('Content-Length', result.size);
        res.setHeader('X-Recording-Duration', result.data.length);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.send(result.data);
    }
    catch (error) {
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
router.post('/:id/confirm', (req, res, next) => (0, auth_1.authMiddleware)(req, res, next), async (req, res, next) => {
    try {
        const result = await recordingService.confirmRecordingUpload(req.params.id, req.user.userId);
        res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
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
        const checkpoints = await recordingService.getRecordingCheckpoints(req.params.id);
        res.json({
            success: true,
            data: { checkpoints },
        });
    }
    catch (error) {
        next(error);
    }
});
// POST /api/recordings/:id/checkpoints - Create checkpoint
router.post('/:id/checkpoints', (req, res, next) => (0, auth_1.authMiddleware)(req, res, next), async (req, res, next) => {
    try {
        const validated = createCheckpointSchema.parse(req.body);
        const checkpoint = await recordingService.createCheckpoint(req.params.id, req.user.userId, validated);
        res.status(201).json({
            success: true,
            data: { checkpoint },
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
//# sourceMappingURL=recordings.js.map