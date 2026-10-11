/**
 * QuizBuzz AI - Shared API Contract and Domain Types
 * Conforms to docs/03-api-contract.md and docs/07-scoring-and-quiz-rules.md
 */

// Error format
export type ErrorCode =
  | 'INVALID_FILE'
  | 'FILE_TOO_LARGE'
  | 'UNSUPPORTED_FILE_TYPE'
  | 'NO_EXTRACTABLE_TEXT'
  | 'SESSION_EXPIRED'
  | 'SESSION_NOT_FOUND'
  | 'INVALID_SELECTION'
  | 'INSUFFICIENT_SOURCE_CONTENT'
  | 'MODEL_UNAVAILABLE'
  | 'GENERATION_FAILED'
  | 'INVALID_QUIZ_CONFIGURATION'
  | 'QUIZ_NOT_FOUND'
  | 'INVALID_ANSWER'
  | 'INTERNAL_ERROR';

export interface ApiErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    requestId?: string;
  };
}

// Session
export interface SessionResponse {
  sessionId: string;
  expiresAt: string;
}

// Document
export interface DocumentSection {
  id: string;
  title: string;
  startOffset?: number;
  endOffset?: number;
  startPage?: number;
  endPage?: number;
  slideNumber?: number;
}

export interface DocumentMetadata {
  name: string;
  characterCount: number;
  sections: DocumentSection[];
  preview: string;
}

export interface DocumentResponse {
  document: DocumentMetadata;
}

// Quiz Generation Configuration
export type QuizDifficulty = 'easy' | 'medium' | 'hard';
export type QuizMode = 'practice' | 'exam';
export type QuizNavigation = 'one-by-one' | 'all-at-once';

export type QuizSourceSelection =
  | { type: 'document' }
  | { type: 'section'; sectionId: string }
  | { type: 'page-range'; startPage: number; endPage: number };

export interface QuizConfigRequest {
  source: QuizSourceSelection;
  questionCount: number; // 1 to 50
  difficulty: QuizDifficulty;
  mode: QuizMode;
  navigation: QuizNavigation;
  timerSeconds?: number | null;
  marksPerCorrect: number;
  negativeMarksPerIncorrect: number;
}

// Quiz Question Options
export interface QuizOption {
  id: 'a' | 'b' | 'c' | 'd' | string;
  text: string;
}

export interface QuestionSourceRef {
  startOffset?: number;
  endOffset?: number;
  page?: number;
  slide?: number;
}

export interface ClientQuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
  // Present only in practice mode or after exam submission
  correctOptionId?: string;
  explanation?: string;
  source?: QuestionSourceRef;
}

export interface QuizResponse {
  quizId: string;
  config: QuizConfigRequest;
  questions: ClientQuizQuestion[];
  totalQuestions: number;
  reducedReason?: string; // If fewer questions were generated due to source content
}

// Answer Submissions
export interface AnswerSelection {
  questionId: string;
  selectedOptionId: string;
}

export interface SubmitQuizRequest {
  answers: AnswerSelection[];
}

export interface QuestionResult {
  questionId: string;
  isCorrect: boolean;
  selectedOptionId?: string;
  correctOptionId: string;
  explanation: string;
  source?: QuestionSourceRef;
}

export interface QuizSubmissionResult {
  score: number;
  maximumScore: number;
  percentage: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  results: QuestionResult[];
  feedbackNotes?: string;
}

// Internal Representation of Question with Answer Key (Never sent to exam-mode client before submission)
export interface InternalQuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
  correctOptionId: string;
  explanation: string;
  source?: QuestionSourceRef;
}
