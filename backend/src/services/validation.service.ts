import type { InternalQuizQuestion, QuizOption } from '@quizbuzz/shared';

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
      return { validQuestions: [], errors: ['Model output is not an array of questions.'] };
    }

    const lowerSource = sourceText.toLowerCase();

    for (let i = 0; i < rawQuestions.length; i++) {
      const q = rawQuestions[i];
      if (!q || typeof q !== 'object') {
        errors.push(`Item #${i + 1} is not a valid question object.`);
        continue;
      }

      // 1. Question text normalization
      const questionText = (q.question || q.questionText || q.prompt || '').trim();
      if (!questionText || questionText.length < 5) {
        errors.push(`Question #${i + 1} has empty or invalid text.`);
        continue;
      }

      const normalizedQ = questionText.toLowerCase();
      if (seenQuestionTexts.has(normalizedQ)) {
        errors.push(`Question #${i + 1} is a duplicate question.`);
        continue;
      }

      // 2. Options normalization (handles objects, string arrays, key/value pairs)
      const normalizedOptions = this.normalizeOptions(q.options || q.choices);
      if (!normalizedOptions || normalizedOptions.length !== 4) {
        errors.push(`Question #${i + 1} does not have exactly 4 valid options.`);
        continue;
      }

      // 3. Resolve correct option ID
      const correctOptionId = this.resolveCorrectOptionId(q, normalizedOptions);
      if (!correctOptionId) {
        errors.push(`Question #${i + 1} correct answer could not be mapped to one of the 4 options.`);
        continue;
      }

      // 4. Explanation
      const explanation = (q.explanation || q.rationale || q.reason || '').trim() ||
        'Grounded directly in the provided source text.';

      // 5. Source grounding check (checks question, options, and explanation against source)
      const isGrounded = this.checkGrounding(questionText, normalizedOptions, explanation, lowerSource);
      if (!isGrounded) {
        errors.push(`Question #${i + 1} failed grounding check against source text.`);
        continue;
      }

      seenQuestionTexts.add(normalizedQ);

      validQuestions.push({
        id: `q${validQuestions.length + 1}`,
        question: questionText,
        options: normalizedOptions,
        correctOptionId,
        explanation,
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

  private normalizeOptions(rawOptions: any): QuizOption[] | null {
    if (!rawOptions) return null;

    const ids = ['a', 'b', 'c', 'd'];

    // Case 1: Array of objects [{ id: 'a', text: '...' }] or [{ option: 'A', text: '...' }]
    if (Array.isArray(rawOptions)) {
      if (rawOptions.length !== 4) return null;

      // Subcase: Array of strings ["Opt 1", "Opt 2", "Opt 3", "Opt 4"]
      if (typeof rawOptions[0] === 'string') {
        const uniqueTexts = new Set(rawOptions.map((s) => String(s).trim().toLowerCase()));
        if (uniqueTexts.size < 4) return null;

        return rawOptions.map((text, idx) => ({
          id: ids[idx],
          text: String(text).replace(/^[a-d][).:-]\s*/i, '').trim()
        }));
      }

      // Subcase: Array of objects
      const result: QuizOption[] = [];
      const seenIds = new Set<string>();
      const seenTexts = new Set<string>();

      for (let i = 0; i < rawOptions.length; i++) {
        const item = rawOptions[i];
        if (!item || typeof item !== 'object') return null;

        const optId = String(item.id || item.option || item.key || item.label || ids[i]).trim().toLowerCase();
        const optText = String(item.text || item.value || item.content || '').trim();

        if (!optText) return null;

        const normalizedText = optText.toLowerCase();
        if (seenTexts.has(normalizedText)) {
          return null; // Reject duplicate option text
        }
        seenTexts.add(normalizedText);

        const assignedId = !ids.includes(optId) || seenIds.has(optId) ? ids[i] : optId;
        if (seenIds.has(assignedId)) return null;
        seenIds.add(assignedId);

        result.push({ id: assignedId, text: optText });
      }

      return result.length === 4 ? result : null;
    }

    // Case 2: Object map { "A": "Text A", "B": "Text B", ... }
    if (typeof rawOptions === 'object') {
      const keys = Object.keys(rawOptions);
      if (keys.length === 4) {
        return keys.map((key, idx) => ({
          id: ids[idx],
          text: String(rawOptions[key]).trim()
        }));
      }
    }

    return null;
  }

  private resolveCorrectOptionId(q: any, options: QuizOption[]): string | null {
    const rawAnswer = String(
      q.correctOptionId ||
      q.correct_option_id ||
      q.correctAnswer ||
      q.correct_answer ||
      q.answer ||
      q.answerKey ||
      q.solution ||
      ''
    ).trim();

    if (!rawAnswer) return null;

    // Direct match: 'a', 'b', 'c', 'd'
    const cleanId = rawAnswer.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    if (['a', 'b', 'c', 'd'].includes(cleanId)) {
      return cleanId;
    }

    // Number match: '1' -> 'a', '2' -> 'b', etc.
    const numMap: Record<string, string> = { '1': 'a', '2': 'b', '3': 'c', '4': 'd' };
    if (numMap[cleanId]) {
      return numMap[cleanId];
    }

    // Text match: matches option text directly
    const lowerAnswer = rawAnswer.toLowerCase();
    for (const opt of options) {
      if (opt.text.toLowerCase() === lowerAnswer || lowerAnswer.includes(opt.text.toLowerCase())) {
        return opt.id;
      }
    }

    return null;
  }

  private checkGrounding(
    question: string,
    options: QuizOption[],
    explanation: string,
    lowerSource: string
  ): boolean {
    // Combine all textual elements of this question
    const allText = `${question} ${options.map((o) => o.text).join(' ')} ${explanation}`.toLowerCase();
    const words = allText
      .replace(/[^a-z0-9 ]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 4);

    if (words.length === 0) return true;

    let matchCount = 0;
    for (const w of words) {
      if (lowerSource.includes(w)) {
        matchCount++;
      }
    }

    // At least some content keywords must anchor the question in the source
    return matchCount > 0;
  }
}

export const validationService = new ValidationService();
