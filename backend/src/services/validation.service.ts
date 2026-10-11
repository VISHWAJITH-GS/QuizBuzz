import type { InternalQuizQuestion } from '@quizbuzz/shared';

export interface ValidationResult {
  validQuestions: InternalQuizQuestion[];
  errors: string[];
}

export class ValidationService {
  validateQuestions(
    rawQuestions: any[],
    sourceText: string,
    requestedCount: number
  ): ValidationResult {
    const validQuestions: InternalQuizQuestion[] = [];
    const errors: string[] = [];
    const seenQuestionTexts = new Set<string>();

    if (!Array.isArray(rawQuestions)) {
      return { validQuestions: [], errors: ['Model output root "questions" is not an array.'] };
    }

    for (let i = 0; i < rawQuestions.length; i++) {
      const q = rawQuestions[i];

      // 1. Structure and required fields
      if (!q.question || typeof q.question !== 'string' || q.question.trim().length < 5) {
        errors.push(`Question #${i + 1} has empty or invalid text.`);
        continue;
      }

      const normalizedQ = q.question.trim().toLowerCase();
      if (seenQuestionTexts.has(normalizedQ)) {
        errors.push(`Question #${i + 1} is a duplicate.`);
        continue;
      }

      // 2. Options validation (exactly 4 options)
      if (!Array.isArray(q.options) || q.options.length !== 4) {
        errors.push(`Question #${i + 1} does not have exactly 4 options.`);
        continue;
      }

      const optionIds = new Set<string>();
      const optionTexts = new Set<string>();
      let optionsValid = true;

      for (const opt of q.options) {
        if (!opt.id || !opt.text || typeof opt.text !== 'string' || opt.text.trim().length === 0) {
          optionsValid = false;
          break;
        }
        const optId = String(opt.id).toLowerCase();
        const optText = opt.text.trim().toLowerCase();

        if (optionIds.has(optId) || optionTexts.has(optText)) {
          optionsValid = false;
          break;
        }
        optionIds.add(optId);
        optionTexts.add(optText);
      }

      if (!optionsValid) {
        errors.push(`Question #${i + 1} contains malformed or duplicate options.`);
        continue;
      }

      // 3. Exactly one correct answer matching one of the options
      const correctId = String(q.correctOptionId || '').toLowerCase();
      if (!optionIds.has(correctId)) {
        errors.push(`Question #${i + 1} correctOptionId (${correctId}) does not match any valid option ID.`);
        continue;
      }

      // 4. Explanation
      const explanation = (q.explanation && typeof q.explanation === 'string' && q.explanation.trim()) ||
        'Derived directly from the source text.';

      // 5. Source grounding check (conservative sanity check)
      // Verify question isn't completely fabricated unrelated keywords
      const questionWords = normalizedQ
        .replace(/[^a-z0-9 ]/g, ' ')
        .split(/\s+/)
        .filter((w: string) => w.length > 4);

      const lowerSource = sourceText.toLowerCase();
      let matchedWordCount = 0;
      for (const word of questionWords) {
        if (lowerSource.includes(word)) {
          matchedWordCount++;
        }
      }

      // If the question has long words and none appear in source text, it's ungrounded
      if (questionWords.length > 2 && matchedWordCount === 0) {
        errors.push(`Question #${i + 1} failed grounding check against source text.`);
        continue;
      }

      seenQuestionTexts.add(normalizedQ);

      validQuestions.push({
        id: `q${validQuestions.length + 1}`,
        question: q.question.trim(),
        options: q.options.map((opt: any) => ({
          id: String(opt.id).toLowerCase(),
          text: opt.text.trim()
        })),
        correctOptionId: correctId,
        explanation: explanation.trim(),
        ...(q.source && typeof q.source === 'object'
          ? {
              source: {
                startOffset: typeof q.source.startOffset === 'number' ? q.source.startOffset : undefined,
                endOffset: typeof q.source.endOffset === 'number' ? q.source.endOffset : undefined,
                page: typeof q.source.page === 'number' ? q.source.page : undefined,
                slide: typeof q.source.slide === 'number' ? q.source.slide : undefined
              }
            }
          : {})
      });

      if (validQuestions.length >= requestedCount) {
        break;
      }
    }

    return { validQuestions, errors };
  }
}

export const validationService = new ValidationService();
