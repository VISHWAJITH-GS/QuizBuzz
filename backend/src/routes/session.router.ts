import { Router, Request, Response, NextFunction } from 'express';
import { sessionService } from '../services/session.service.js';
import { requireSession } from '../middleware/session.middleware.js';
import { SessionResponse } from '@quizbuzz/shared';

export const sessionRouter = Router();

// POST /api/v1/sessions
sessionRouter.post('/sessions', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId, expiresAt } = await sessionService.createSession();

    // Set cookie for browser clients (HttpOnly)
    res.cookie('sessionId', sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 60 * 1000
    });

    const payload: SessionResponse = {
      sessionId,
      expiresAt: expiresAt.toISOString()
    };

    res.status(201).json(payload);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/sessions/current
sessionRouter.delete('/sessions/current', requireSession, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = req.sessionId!;
    await sessionService.deleteSession(sessionId);

    res.clearCookie('sessionId');
    res.status(200).json({ success: true, message: 'Session deleted successfully.' });
  } catch (err) {
    next(err);
  }
});
