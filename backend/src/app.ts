import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { requestLogger } from './middleware/logging.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import { healthRouter } from './routes/health.router.js';
import { sessionRouter } from './routes/session.router.js';
import { documentRouter } from './routes/document.router.js';
import { quizRouter } from './routes/quiz.router.js';

export const app = express();

app.use(
  cors({
    origin: true,
    credentials: true
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(requestLogger);

// Health check on root and api path
app.use('/', healthRouter);
app.use('/api/v1', healthRouter);

// Core API endpoints
app.use('/api/v1', sessionRouter);
app.use('/api/v1', documentRouter);
app.use('/api/v1', quizRouter);

// 404 fallback
app.use((_req, res) => {
  res.status(404).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'The requested endpoint does not exist.'
    }
  });
});

// Centralized error handler
app.use(errorHandler);
