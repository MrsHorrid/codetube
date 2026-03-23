import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

import { errorHandler } from './middleware/validation';

// Routes
import authRoutes from './routes/auth';
import tutorialRoutes from './routes/tutorials';
import recordingRoutes from './routes/recordings';
import progressRoutes from './routes/progress';
import forksRoutes, { forksRouter } from './routes/forks';
import generateRoutes from './routes/generate';

const app: Application = express();

// Middleware
app.use(helmet());

// CORS - configurable via CORS_ORIGIN env var (comma-separated origins, or '*' for all)
const corsOrigin = process.env.CORS_ORIGIN;
const corsOptions: cors.CorsOptions = corsOrigin
  ? {
      origin: corsOrigin === '*' ? '*' : corsOrigin.split(',').map((o) => o.trim()),
      credentials: corsOrigin !== '*',
    }
  : { origin: true, credentials: true };
app.use(cors(corsOptions));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
const { version } = require('../package.json') as { version: string };
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', version, timestamp: new Date().toISOString() });
});

// ─── Audio File Serving ───────────────────────────────────────
// Serves generated (and mock) audio files from AUDIO_STORAGE_DIR.
// In production, offload this to a CDN / object storage.
const audioStorageDir = process.env.AUDIO_STORAGE_DIR || '/tmp/codetube-audio';
// Ensure the directory exists on startup
if (!fs.existsSync(audioStorageDir)) {
  fs.mkdirSync(audioStorageDir, { recursive: true });
}
app.use('/api/audio', express.static(audioStorageDir, { maxAge: '1h' }));

// Mock audio endpoint: returns a silent 1s MP3 for any mock URL
// so the frontend never hard-errors when Fish Audio is not configured.
app.get('/api/audio/mock/:persona/:filename', (_req: Request, res: Response) => {
  // Tiny valid MP3 (1 frame of silence at 128kbps)
  // This is a minimal valid MP3 header so audio elements don't error.
  const silentMp3 = Buffer.from(
    'fffb9000000000000000000000000000000000000000000000000000000000000000' +
    '000000000000000000000000000000000000000000000000000000000000000000000000',
    'hex'
  );
  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(silentMp3);
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/generate-course', generateRoutes);
app.use('/api/tutorials', tutorialRoutes);
app.use('/api/tutorials', forksRoutes); // POST /api/tutorials/:id/forks
app.use('/api/tutorials', progressRoutes); // PUT /api/tutorials/:id/progress
app.use('/api/recordings', recordingRoutes);
app.use('/api/me/forks', forksRouter);
app.use('/api/me/progress', progressRoutes);
app.use('/api/forks', forksRouter);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Route not found' },
  });
});

// Error handler
app.use(errorHandler);

export default app;
