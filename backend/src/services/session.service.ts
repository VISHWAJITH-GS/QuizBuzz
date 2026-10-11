import crypto from 'crypto';
import { config } from '../config/env.js';
import { db } from '../db/pool.js';
import type {
  DocumentSection,
  InternalQuizQuestion,
  QuizConfigRequest,
  QuizSubmissionResult
} from '@quizbuzz/shared';

export interface TransientDocument {
  name: string;
  characterCount: number;
  sections: DocumentSection[];
  preview: string;
  fullText: string;
}

export interface TransientQuiz {
  quizId: string;
  config: QuizConfigRequest;
  questions: InternalQuizQuestion[];
  generatedAt: string;
  submittedAt?: string;
  results?: QuizSubmissionResult;
}

export interface SessionState {
  sessionId: string;
  createdAt: Date;
  expiresAt: Date;
  document?: TransientDocument;
  activeQuiz?: TransientQuiz;
}

class SessionService {
  private inMemoryState = new Map<string, SessionState>();

  async createSession(): Promise<{ sessionId: string; expiresAt: Date }> {
    const sessionId = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + config.SESSION_TTL_MINUTES * 60 * 1000);

    const row = await db.saveSession(sessionId, expiresAt);

    this.inMemoryState.set(sessionId, {
      sessionId,
      createdAt: row.created_at,
      expiresAt: row.expires_at
    });

    return { sessionId, expiresAt: row.expires_at };
  }

  async validateAndTouchSession(sessionId: string): Promise<SessionState | null> {
    if (!sessionId) return null;

    const row = await db.getSession(sessionId);
    if (!row) {
      this.inMemoryState.delete(sessionId);
      return null;
    }

    const now = new Date();
    if (row.expires_at <= now) {
      await this.deleteSession(sessionId);
      return null;
    }

    // Refresh expiry (sliding window)
    const newExpiresAt = new Date(Date.now() + config.SESSION_TTL_MINUTES * 60 * 1000);
    await db.updateExpiry(sessionId, newExpiresAt);

    let state = this.inMemoryState.get(sessionId);
    if (!state) {
      // Backend restart recovery: DB row exists, but in-memory state was cleared
      state = {
        sessionId,
        createdAt: row.created_at,
        expiresAt: newExpiresAt
      };
      this.inMemoryState.set(sessionId, state);
    } else {
      state.expiresAt = newExpiresAt;
    }

    return state;
  }

  getState(sessionId: string): SessionState | undefined {
    return this.inMemoryState.get(sessionId);
  }

  setDocument(sessionId: string, doc: TransientDocument): void {
    const state = this.inMemoryState.get(sessionId);
    if (state) {
      // Clear any previous quiz when a new document is uploaded
      state.document = doc;
      delete state.activeQuiz;
    }
  }

  clearDocument(sessionId: string): void {
    const state = this.inMemoryState.get(sessionId);
    if (state) {
      delete state.document;
      delete state.activeQuiz;
    }
  }

  setActiveQuiz(sessionId: string, quiz: TransientQuiz): void {
    const state = this.inMemoryState.get(sessionId);
    if (state) {
      // Discard previous in-progress quiz without confirmation dialog per requirement
      state.activeQuiz = quiz;
    }
  }

  clearActiveQuiz(sessionId: string): void {
    const state = this.inMemoryState.get(sessionId);
    if (state) {
      delete state.activeQuiz;
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    await db.deleteSession(sessionId);
    this.inMemoryState.delete(sessionId);
  }

  async cleanupExpiredSessions(): Promise<{ count: number; durationMs: number }> {
    const start = Date.now();
    const purgedCount = await db.purgeExpiredSessions();

    const now = new Date();
    let memoryPurged = 0;
    for (const [id, state] of this.inMemoryState.entries()) {
      if (state.expiresAt <= now) {
        this.inMemoryState.delete(id);
        memoryPurged++;
      }
    }

    return {
      count: Math.max(purgedCount, memoryPurged),
      durationMs: Date.now() - start
    };
  }
}

export const sessionService = new SessionService();
