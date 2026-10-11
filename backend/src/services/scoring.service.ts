import type {
  AnswerSelection,
  InternalQuizQuestion,
  QuizConfigRequest,
  QuizSubmissionResult,
  QuestionResult
} from '@quizbuzz/shared';

export class ScoringService {
  calculateScore(
    questions: InternalQuizQuestion[],
    answers: AnswerSelection[],
    config: QuizConfigRequest
  ): QuizSubmissionResult {
    const marksPerCorrect = Math.max(0, config.marksPerCorrect ?? 1);
    const negativeMarks = Math.max(0, config.negativeMarksPerIncorrect ?? 0);

    const answerMap = new Map<string, string>();
    for (const ans of answers) {
      if (ans.questionId && ans.selectedOptionId) {
        answerMap.set(ans.questionId, String(ans.selectedOptionId).toLowerCase());
      }
    }

    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    const results: QuestionResult[] = [];

    for (const q of questions) {
      const selected = answerMap.get(q.id);
      const isUnanswered = selected === undefined || selected === '';
      const isCorrect = !isUnanswered && selected === q.correctOptionId.toLowerCase();

      if (isUnanswered) {
        unansweredCount++;
      } else if (isCorrect) {
        correctCount++;
      } else {
        incorrectCount++;
      }

      results.push({
        questionId: q.id,
        isCorrect,
        selectedOptionId: selected,
        correctOptionId: q.correctOptionId,
        explanation: q.explanation,
        source: q.source
      });
    }

    const rawScore = correctCount * marksPerCorrect - incorrectCount * negativeMarks;
    const totalQuestions = questions.length;
    const maximumScore = totalQuestions * marksPerCorrect;

    // Handle percentage: clamp to 0 if rawScore is negative
    let percentage = 0;
    if (maximumScore > 0) {
      percentage = Math.round((Math.max(0, rawScore) / maximumScore) * 100);
    }

    return {
      score: rawScore,
      maximumScore,
      percentage,
      correctCount,
      incorrectCount,
      unansweredCount,
      results,
      feedbackNotes:
        percentage >= 80
          ? 'Excellent grasp of the material!'
          : percentage >= 50
            ? 'Good effort. Review the explanations for incorrect questions.'
            : 'Consider reviewing the source text and attempting the quiz again.'
    };
  }
}

export const scoringService = new ScoringService();
