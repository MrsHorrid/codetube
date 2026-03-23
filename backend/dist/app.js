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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
dotenv_1.default.config();
const validation_1 = require("./middleware/validation");
// Routes
const auth_1 = __importDefault(require("./routes/auth"));
const tutorials_1 = __importDefault(require("./routes/tutorials"));
const recordings_1 = __importDefault(require("./routes/recordings"));
const progress_1 = __importDefault(require("./routes/progress"));
const forks_1 = __importStar(require("./routes/forks"));
const generate_1 = __importDefault(require("./routes/generate"));
const app = (0, express_1.default)();
// Middleware
app.use((0, helmet_1.default)());
// CORS - configurable via CORS_ORIGIN env var (comma-separated origins, or '*' for all)
const corsOrigin = process.env.CORS_ORIGIN;
const corsOptions = corsOrigin
    ? {
        origin: corsOrigin === '*' ? '*' : corsOrigin.split(',').map((o) => o.trim()),
        credentials: corsOrigin !== '*',
    }
    : { origin: true, credentials: true };
app.use((0, cors_1.default)(corsOptions));
app.use((0, morgan_1.default)(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Health check
const { version } = require('../package.json');
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', version, timestamp: new Date().toISOString() });
});
// ─── Audio File Serving ───────────────────────────────────────
// Serves generated (and mock) audio files from AUDIO_STORAGE_DIR.
// In production, offload this to a CDN / object storage.
const audioStorageDir = process.env.AUDIO_STORAGE_DIR || '/tmp/codetube-audio';
// Ensure the directory exists on startup
if (!fs_1.default.existsSync(audioStorageDir)) {
    fs_1.default.mkdirSync(audioStorageDir, { recursive: true });
}
app.use('/api/audio', express_1.default.static(audioStorageDir, { maxAge: '1h' }));
// Mock audio endpoint: returns a silent 1s MP3 for any mock URL
// so the frontend never hard-errors when Fish Audio is not configured.
app.get('/api/audio/mock/:persona/:filename', (_req, res) => {
    // Tiny valid MP3 (1 frame of silence at 128kbps)
    // This is a minimal valid MP3 header so audio elements don't error.
    const silentMp3 = Buffer.from('fffb9000000000000000000000000000000000000000000000000000000000000000' +
        '000000000000000000000000000000000000000000000000000000000000000000000000', 'hex');
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(silentMp3);
});
// API Routes
app.use('/api/auth', auth_1.default);
app.use('/api/generate-course', generate_1.default);
app.use('/api/tutorials', tutorials_1.default);
app.use('/api/tutorials', forks_1.default); // POST /api/tutorials/:id/forks
app.use('/api/tutorials', progress_1.default); // PUT /api/tutorials/:id/progress
app.use('/api/recordings', recordings_1.default);
app.use('/api/me/forks', forks_1.forksRouter);
app.use('/api/me/progress', progress_1.default);
app.use('/api/forks', forks_1.forksRouter);
// 404 handler
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Route not found' },
    });
});
// Error handler
app.use(validation_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map