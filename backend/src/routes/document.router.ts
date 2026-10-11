import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { documentService } from '../services/document.service.js';
import { sessionService } from '../services/session.service.js';
import { requireSession } from '../middleware/session.middleware.js';
import { AppError } from '../middleware/error.middleware.js';
import type { DocumentResponse } from '@quizbuzz/shared';

export const documentRouter = Router();

// Store files in memory buffer to adhere strictly to non-persistence rules
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100 MB limit
  }
});

// POST /api/v1/documents
documentRouter.post(
  '/documents',
  requireSession,
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new AppError(400, 'INVALID_FILE', 'No file was provided in the upload request.');
      }

      const sessionId = req.sessionId!;
      const extracted = await documentService.processFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      // Store in transient memory state
      sessionService.setDocument(sessionId, {
        ...extracted.metadata,
        fullText: extracted.fullText
      });

      const response: DocumentResponse = {
        document: extracted.metadata
      };

      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/documents/current
documentRouter.get(
  '/documents/current',
  requireSession,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const state = req.sessionState!;
      if (!state.document) {
        throw new AppError(404, 'INVALID_SELECTION', 'No document found for the active session.');
      }

      const { fullText, ...metadata } = state.document;
      const response: DocumentResponse = {
        document: metadata
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/v1/documents/current
documentRouter.delete(
  '/documents/current',
  requireSession,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionId = req.sessionId!;
      sessionService.clearDocument(sessionId);

      res.json({ success: true, message: 'Document and associated quiz discarded.' });
    } catch (err) {
      next(err);
    }
  }
);
