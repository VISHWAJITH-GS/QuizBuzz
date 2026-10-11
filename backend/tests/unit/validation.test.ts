import { describe, it, expect } from 'vitest';
import { validationService } from '../../src/services/validation.service.js';

describe('ValidationService', () => {
  const sourceText = 'Photosynthesis is a chemical process that plants use to synthesize glucose from sunlight and carbon dioxide.';

  it('accepts valid, well-structured grounded questions', () => {
    const rawQuestions = [
      {
        question: 'What is the primary chemical process that plants use to produce glucose?',
        options: [
          { id: 'a', text: 'Photosynthesis' },
          { id: 'b', text: 'Fermentation' },
          { id: 'c', text: 'Cellular Respiration' },
          { id: 'd', text: 'Glycolysis' }
        ],
        correctOptionId: 'a',
        explanation: 'The text states that plants use photosynthesis to synthesize glucose.'
      }
    ];

    const result = validationService.validateQuestions(rawQuestions, sourceText, 5);
    expect(result.validQuestions.length).toBe(1);
    expect(result.errors.length).toBe(0);
    expect(result.validQuestions[0].id).toBe('q1');
  });

  it('rejects questions with invalid option counts or duplicate option text', () => {
    const rawQuestions = [
      {
        question: 'What is the process?',
        options: [
          { id: 'a', text: 'Same Option' },
          { id: 'b', text: 'Same Option' },
          { id: 'c', text: 'Option C' },
          { id: 'd', text: 'Option D' }
        ],
        correctOptionId: 'a'
      },
      {
        question: 'What is another process?',
        options: [
          { id: 'a', text: 'Option A' },
          { id: 'b', text: 'Option B' }
        ],
        correctOptionId: 'a'
      }
    ];

    const result = validationService.validateQuestions(rawQuestions, sourceText, 5);
    expect(result.validQuestions.length).toBe(0);
    expect(result.errors.length).toBe(2);
  });

  it('rejects ungrounded questions with fabricated terms', () => {
    const rawQuestions = [
      {
        question: 'Which medieval monarch signed the Magna Carta at Runnymede in England?',
        options: [
          { id: 'a', text: 'King John' },
          { id: 'b', text: 'King Henry' },
          { id: 'c', text: 'King Edward' },
          { id: 'd', text: 'King Richard' }
        ],
        correctOptionId: 'a',
        explanation: 'Medieval English history fact.'
      }
    ];

    const result = validationService.validateQuestions(rawQuestions, sourceText, 5);
    expect(result.validQuestions.length).toBe(0);
    expect(result.errors[0]).toContain('failed grounding check');
  });
});
