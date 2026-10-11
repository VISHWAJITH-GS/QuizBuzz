import { Request, Response, NextFunction } from 'express';
import { ErrorCode } from '@quizbuzz/shared';

export class AppError extends Error {
  public statusCode: number;
  public errorCode: ErrorCode;

  constructor(statusCode: number, errorCode: ErrorCode, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = (req as any).requestId;

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.errorCode,
        message: err.message,
        requestId
      }
    });
    return;
  }

  // Handle Multer upload errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        error: {
          code: 'FILE_TOO_LARGE',
          message: 'The file exceeds the maximum 10 MB limit.',
          requestId
        }
      });
      return;
    }
    res.status(400).json({
      error: {
        code: 'INVALID_FILE',
        message: err.message || 'File upload error.',
        requestId
      }
    });
    return;
  }

  // Catch-all internal error (never expose stack trace or internal secrets)
  console.error('[Error] Unhandled error category:', err?.name || 'Error', '[ReqID:', requestId, ']');
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An internal error occurred. Please try again.',
      requestId
    }
  });
}
