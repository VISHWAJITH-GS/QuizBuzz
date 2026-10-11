import { Router, Request, Response } from 'express';
import { db } from '../db/pool.js';

export const healthRouter = Router();

healthRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: db.isUsingFallback() ? 'memory-fallback' : 'postgresql'
  });
});
