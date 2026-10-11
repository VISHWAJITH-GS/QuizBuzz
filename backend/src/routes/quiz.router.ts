import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { sessionService } from '../services/session.service.js';
import { aiService } from '../services/ai.service.js';
import { scoringService } from '../services/scoring.service.js';
import { requireSession } from '../middleware/session.middleware.js';
import { AppError } from '../middleware/error.middleware.js';
import type {
  ClientQuizQuestion,
  QuizConfigRequest,
  QuizResponse,
  SubmitQuizRequest
} from '@quizbuzz/shared';

export const quizRouter = Router();

const quizConfigSchema = z.object({
  source: z.discriminatedUnion('type', [
    z.object({ type: z.literal('document') }),
    z.object({ type: z.literal('section'), sectionId: z.string() }),
    z.object({ type: z.literal('page-range'), startPage: z.number().int().positive(), endPage: z.number().int().positive() })
  ]),
  questionCount: z.number().int().min(1).max(50),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  mode: z.enum(['practice', 'exam']),
  navigation: z.enum(['one-by-one', 'all-at-once']),
  timerSeconds: z.number().int().positive().nullable().optional(),
  marksPerCorrect: z.number().min(0).max(100).default(1),
  negativeMarksPerIncorrect: z.number().min(0).max(50).default(0)
});

const submitSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string(),
      selectedOptionId: z.string()
    })
  )
});

function sanitizeQuestionsForClient(
  questions: any[],
  mode: 'practice' | 'exam',
  isSubmitted: boolean
): ClientQuizQuestion[] {
  return questions.map((q) => {
    if (mode === 'exam' && !isSubmitted) {
      // In Exam Mode, never expose correctOptionId or explanation prior to submission
      return {
        id: q.id,
        question: q.question,
        options: q.options,
        source: q.source ? { page: q.source.page, slide: q.source.slide } : undefined
      };
    }

    return {
      id: q.id,
      question: q.question,
      options: q.options,
      correctOptionId: q.correctOptionId,
      explanation: q.explanation,
      source: q.source
    };
  });
}

// POST /api/v1/quizzes
quizRouter.post(
  '/quizzes',
  requireSession,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const state = req.sessionState!;
      if (!state.document) {
        throw new AppError(400, 'INVALID_SELECTION', 'Please upload a document before generating a quiz.');
      }

      const parseResult = quizConfigSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new AppError(
          400,
          'INVALID_QUIZ_CONFIGURATION',
          `Invalid configuration: ${parseResult.error.errors.map((e) => e.message).join(', ')}`
        );
      }

      const quizConfig: QuizConfigRequest = parseResult.data;

      // Extract target text based on selection
      let targetText = state.document.fullText;
      let targetContext: { page?: number; slide?: number } | undefined;

      if (quizConfig.source.type === 'section') {
        const found = state.document.sections.find((s) => s.id === (quizConfig.source as any).sectionId);
        if (!found) {
          throw new AppError(400, 'INVALID_SELECTION', 'Selected section ID was not found in document.');
        }

        if (typeof found.startOffset === 'number' && typeof found.endOffset === 'number') {
          targetText = state.document.fullText.slice(found.startOffset, found.endOffset);
        }
        targetContext = { page: found.startPage, slide: found.slideNumber };
      }

      const { questions, reducedReason } = await aiService.generateQuiz(
        targetText,
        quizConfig,
        targetContext
      );

      const quizId = `quiz-${crypto.randomBytes(8).toString('hex')}`;

      // Save internal quiz state (with answer key) in memory session
      sessionService.setActiveQuiz(state.sessionId, {
        quizId,
        config: quizConfig,
        questions,
        generatedAt: new Date().toISOString()
      });

      const clientQuestions = sanitizeQuestionsForClient(questions, quizConfig.mode, false);

      const response: QuizResponse = {
        quizId,
        config: quizConfig,
        questions: clientQuestions,
        totalQuestions: clientQuestions.length,
        reducedReason
      };

      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/quizzes/current
quizRouter.get(
  '/quizzes/current',
  requireSession,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const state = req.sessionState!;
      if (!state.activeQuiz) {
        throw new AppError(404, 'QUIZ_NOT_FOUND', 'No active quiz found for this session.');
      }

      const quiz = state.activeQuiz;
      const isSubmitted = !!quiz.submittedAt;
      const clientQuestions = sanitizeQuestionsForClient(quiz.questions, quiz.config.mode, isSubmitted);

      const response: QuizResponse = {
        quizId: quiz.quizId,
        config: quiz.config,
        questions: clientQuestions,
        totalQuestions: clientQuestions.length
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/quizzes/current/submit
quizRouter.post(
  '/quizzes/current/submit',
  requireSession,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const state = req.sessionState!;
      if (!state.activeQuiz) {
        throw new AppError(404, 'QUIZ_NOT_FOUND', 'No active quiz found to submit.');
      }

      const parseResult = submitSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new AppError(
          400,
          'INVALID_ANSWER',
          `Invalid answer payload: ${parseResult.error.errors.map((e) => e.message).join(', ')}`
        );
      }

      const { answers } = parseResult.data;
      const quiz = state.activeQuiz;

      // Grade answers on server using hidden answer key
      const results = scoringService.calculateScore(quiz.questions, answers, quiz.config);

      quiz.submittedAt = new Date().toISOString();
      quiz.results = results;

      res.json(results);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/v1/quizzes/current
quizRouter.delete(
  '/quizzes/current',
  requireSession,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      sessionService.clearActiveQuiz(req.sessionId!);
      res.json({ success: true, message: 'Current quiz discarded.' });
    } catch (err) {
      next(err);
    }
  }
);
