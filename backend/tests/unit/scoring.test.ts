import { describe, it, expect } from 'vitest';
import { scoringService } from '../../src/services/scoring.service.js';
import type { InternalQuizQuestion, QuizConfigRequest } from '@quizbuzz/shared';

describe('ScoringService', () => {
  const mockQuestions: InternalQuizQuestion[] = [
    {
      id: 'q1',
      question: 'Question 1',
      options: [
        { id: 'a', text: 'Option A' },
        { id: 'b', text: 'Option B' },
        { id: 'c', text: 'Option C' },
        { id: 'd', text: 'Option D' }
      ],
      correctOptionId: 'a',
      explanation: 'Explanation 1'
    },
    {
      id: 'q2',
      question: 'Question 2',
      options: [
        { id: 'a', text: 'Option A' },
        { id: 'b', text: 'Option B' },
        { id: 'c', text: 'Option C' },
        { id: 'd', text: 'Option D' }
      ],
      correctOptionId: 'c',
      explanation: 'Explanation 2'
    }
  ];

  it('calculates perfect score without negative marking', () => {
    const config: QuizConfigRequest = {
      source: { type: 'document' },
      questionCount: 2,
      difficulty: 'medium',
      mode: 'exam',
      navigation: 'one-by-one',
      marksPerCorrect: 2,
      negativeMarksPerIncorrect: 0
    };

    const answers = [
      { questionId: 'q1', selectedOptionId: 'a' },
      { questionId: 'q2', selectedOptionId: 'c' }
    ];

    const result = scoringService.calculateScore(mockQuestions, answers, config);

    expect(result.correctCount).toBe(2);
    expect(result.incorrectCount).toBe(0);
    expect(result.unansweredCount).toBe(0);
    expect(result.score).toBe(4);
    expect(result.maximumScore).toBe(4);
    expect(result.percentage).toBe(100);
  });

  it('deducts negative marks correctly and handles unanswered questions', () => {
    const config: QuizConfigRequest = {
      source: { type: 'document' },
      questionCount: 2,
      difficulty: 'medium',
      mode: 'exam',
      navigation: 'one-by-one',
      marksPerCorrect: 4,
      negativeMarksPerIncorrect: 1
    };

    // q1 is wrong, q2 is unanswered
    const answers = [{ questionId: 'q1', selectedOptionId: 'b' }];

    const result = scoringService.calculateScore(mockQuestions, answers, config);

    expect(result.correctCount).toBe(0);
    expect(result.incorrectCount).toBe(1);
    expect(result.unansweredCount).toBe(1);
    expect(result.score).toBe(-1); // 0*4 - 1*1 = -1
    expect(result.maximumScore).toBe(8);
    expect(result.percentage).toBe(0); // clamped to 0
  });
});
