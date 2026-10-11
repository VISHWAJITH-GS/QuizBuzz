import { Request, Response, NextFunction } from 'express';
import { sessionService, SessionState } from '../services/session.service.js';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      sessionId?: string;
      sessionState?: SessionState;
    }
  }
}

export async function requireSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  const sessionId = (req.headers['x-session-id'] as string) || req.cookies?.sessionId;

  if (!sessionId) {
    res.status(401).json({
      error: {
        code: 'SESSION_NOT_FOUND',
        message: 'No session provided. Please initialize a session first.'
      }
    });
    return;
  }

  const sessionState = await sessionService.validateAndTouchSession(sessionId);

  if (!sessionState) {
    res.status(401).json({
      error: {
        code: 'SESSION_EXPIRED',
        message: 'Session has expired or does not exist. Please upload a document again.'
      }
    });
    return;
  }

  req.sessionId = sessionId;
  req.sessionState = sessionState;
  next();
}
