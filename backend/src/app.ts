import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

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
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
