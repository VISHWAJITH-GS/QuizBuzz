import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, XCircle, AlertCircle, Send, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';
import { api } from '../api/client.js';
import type {
  ClientQuizQuestion,
  QuizResponse,
  QuizSubmissionResult
} from '@quizbuzz/shared';

interface QuizRunnerViewProps {
  quiz: QuizResponse;
  onSubmitCompleted: (result: QuizSubmissionResult) => void;
  onDiscard: () => void;
}

export const QuizRunnerView: React.FC<QuizRunnerViewProps> = ({
  quiz,
  onSubmitCompleted,
  onDiscard
}) => {
  const { questions, config } = quiz;
  const isPractice = config.mode === 'practice';
  const isOneByOne = config.navigation === 'one-by-one';

  // Load restored answers from sessionStorage
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    try {
      const saved = sessionStorage.getItem(`quizbuzz_answers_${quiz.quizId}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(() => {
    if (!config.timerSeconds) return null;
    try {
      const savedTime = sessionStorage.getItem(`quizbuzz_time_${quiz.quizId}`);
      return savedTime ? Number(savedTime) : config.timerSeconds;
    } catch {
      return config.timerSeconds;
    }
  });

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Sync answers with sessionStorage
  useEffect(() => {
    sessionStorage.setItem(`quizbuzz_answers_${quiz.quizId}`, JSON.stringify(answers));
  }, [answers, quiz.quizId]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          handleSubmitQuiz(); // Auto-submit on timer expiry
          return 0;
        }
        const updated = prev - 1;
        sessionStorage.setItem(`quizbuzz_time_${quiz.quizId}`, String(updated));
        return updated;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, quiz.quizId]);

  const selectOption = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const handleSubmitQuiz = async () => {
    setSubmitting(true);
    setSubmitError(null);

    const submissionPayload = Object.entries(answers).map(([qId, optId]) => ({
      questionId: qId,
      selectedOptionId: optId
    }));

    try {
      const result = await api.submitQuiz({ answers: submissionPayload });
      // Clear saved in-progress answers on submission
      sessionStorage.removeItem(`quizbuzz_answers_${quiz.quizId}`);
      sessionStorage.removeItem(`quizbuzz_time_${quiz.quizId}`);
      onSubmitCompleted(result);
    } catch (err: any) {
      setSubmitError(err?.error?.message || 'Failed to submit quiz. Please try again.');
      setSubmitting(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const answeredCount = Object.keys(answers).length;

  const renderQuestionCard = (q: ClientQuizQuestion, index: number) => {
    const selectedOption = answers[q.id];
    const hasAnswered = !!selectedOption;

    return (
      <div
        key={q.id}
        id={`question-card-${index}`}
        className="glass-panel"
        style={{ padding: '28px', marginBottom: isOneByOne ? '0' : '24px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: 700 }}>
            Question {index + 1} of {questions.length}
          </span>
          {q.source?.page && (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Source: Page {q.source.page}
            </span>
          )}
          {q.source?.slide && (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Source: Slide {q.source.slide}
            </span>
          )}
        </div>

        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, lineHeight: 1.5, marginBottom: '20px' }}>
          {q.question}
        </h3>

        <div className="options-grid">
          {q.options.map((opt) => {
            const isSelected = selectedOption === opt.id;
            let statusClass = '';

            if (isPractice && hasAnswered) {
              if (opt.id === q.correctOptionId) {
                statusClass = 'correct';
              } else if (isSelected && opt.id !== q.correctOptionId) {
                statusClass = 'incorrect';
              }
            } else if (isSelected) {
              statusClass = 'selected';
            }

            return (
              <button
                key={opt.id}
                id={`q${index}-opt-${opt.id}`}
                type="button"
                className={`option-btn ${statusClass}`}
                onClick={() => selectOption(q.id, opt.id)}
              >
                <div className="option-letter">{opt.id}</div>
                <div style={{ flex: 1 }}>{opt.text}</div>
                {isPractice && hasAnswered && opt.id === q.correctOptionId && (
                  <CheckCircle2 size={18} color="var(--success)" />
                )}
                {isPractice && hasAnswered && isSelected && opt.id !== q.correctOptionId && (
                  <XCircle size={18} color="var(--error)" />
                )}
              </button>
            );
          })}
        </div>

        {/* Practice Mode Instant Explanation */}
        {isPractice && hasAnswered && q.explanation && (
          <div
            style={{
              marginTop: '20px',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              fontSize: '0.9rem',
              lineHeight: 1.6
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--accent-primary)', marginBottom: '4px' }}>
              <HelpCircle size={16} /> Explanation
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>{q.explanation}</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Top Banner with Quiz Progress and Timer */}
      <div
        className="glass-panel"
        style={{
          padding: '16px 24px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {config.mode.toUpperCase()} MODE • {config.difficulty.toUpperCase()}
          </span>
          <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: '2px' }}>
            Answered: {answeredCount} / {questions.length}
          </div>
        </div>

        {timeLeft !== null && (
          <div
            id="quiz-timer-display"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              borderRadius: 'var(--radius-md)',
              background: timeLeft < 60 ? 'var(--error-bg)' : 'rgba(99, 102, 241, 0.15)',
              border: `1px solid ${timeLeft < 60 ? 'var(--error)' : 'rgba(99, 102, 241, 0.3)'}`,
              color: timeLeft < 60 ? '#fca5a5' : 'var(--text-primary)',
              fontWeight: 700,
              fontSize: '1rem'
            }}
          >
            <Clock size={16} color={timeLeft < 60 ? 'var(--error)' : 'var(--accent-primary)'} />
            {formatTimer(timeLeft)}
          </div>
        )}

        <button
          id="btn-discard-quiz"
          className="btn-outline-danger"
          onClick={onDiscard}
        >
          Discard
        </button>
      </div>

      {quiz.reducedReason && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--warning-bg)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            color: '#fcd34d',
            fontSize: '0.85rem',
            marginBottom: '20px'
          }}
        >
          ℹ️ {quiz.reducedReason}
        </div>
      )}

      {/* Questions list */}
      {isOneByOne ? (
        <>
          {renderQuestionCard(questions[currentIndex], currentIndex)}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
            <button
              id="btn-prev-question"
              className="btn-secondary"
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
            >
              <ChevronLeft size={18} /> Previous
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                id="btn-next-question"
                className="btn-primary"
                onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
              >
                Next <ChevronRight size={18} />
              </button>
            ) : (
              <button
                id="btn-submit-quiz"
                className="btn-primary"
                onClick={handleSubmitQuiz}
                disabled={submitting}
              >
                <Send size={16} /> {submitting ? 'Grading...' : 'Submit Quiz'}
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          {questions.map((q, i) => renderQuestionCard(q, i))}

          <div style={{ marginTop: '28px', textAlign: 'center' }}>
            <button
              id="btn-submit-all-quiz"
              className="btn-primary"
              onClick={handleSubmitQuiz}
              disabled={submitting}
              style={{ padding: '14px 40px', fontSize: '1.05rem' }}
            >
              <Send size={18} /> {submitting ? 'Grading...' : 'Submit Answers'}
            </button>
          </div>
        </>
      )}

      {submitError && (
        <div
          style={{
            marginTop: '20px',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--error-bg)',
            color: '#fca5a5',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <AlertCircle size={18} color="var(--error)" />
          <span>{submitError}</span>
        </div>
      )}
    </div>
  );
};
