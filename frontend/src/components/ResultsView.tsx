import React from 'react';
import { Award, CheckCircle2, XCircle, RotateCcw, Upload, BookOpen } from 'lucide-react';
import type { QuizResponse, QuizSubmissionResult } from '@quizbuzz/shared';

interface ResultsViewProps {
  quiz: QuizResponse;
  result: QuizSubmissionResult;
  onRetake: () => void;
  onUploadNew: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  quiz,
  result,
  onRetake,
  onUploadNew
}) => {
  const getScoreBadgeColor = (pct: number) => {
    if (pct >= 80) return 'var(--success)';
    if (pct >= 50) return 'var(--warning)';
    return 'var(--error)';
  };

  const badgeColor = getScoreBadgeColor(result.percentage);

  return (
    <div className="animate-fade-in" style={{ maxWidth: '820px', margin: '0 auto' }}>
      {/* Hero Score Card */}
      <div
        className="glass-panel"
        style={{
          padding: '40px',
          textAlign: 'center',
          marginBottom: '32px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', marginBottom: '16px' }}>
          <Award size={48} color={badgeColor} />
        </div>

        <h2 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '6px' }}>
          Score: {result.score} / {result.maximumScore}
        </h2>

        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: badgeColor, marginBottom: '12px' }}>
          {result.percentage}% Accuracy
        </div>

        {result.feedbackNotes && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '500px', margin: '0 auto 24px' }}>
            {result.feedbackNotes}
          </p>
        )}

        {/* Breakdown counters */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} color="var(--success)" />
            <span style={{ fontWeight: 600 }}>{result.correctCount} Correct</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <XCircle size={18} color="var(--error)" />
            <span style={{ fontWeight: 600 }}>{result.incorrectCount} Incorrect</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <span style={{ color: 'var(--text-secondary)' }}>{result.unansweredCount} Unanswered</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '32px' }}>
          <button id="btn-retake-quiz" className="btn-primary" onClick={onRetake}>
            <RotateCcw size={16} /> Generate Another Quiz
          </button>
          <button id="btn-upload-new" className="btn-secondary" onClick={onUploadNew}>
            <Upload size={16} /> Upload New Document
          </button>
        </div>
      </div>

      {/* Question by Question Review */}
      <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '20px' }}>
        Question Review & Explanations
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {result.results.map((r, index) => {
          const originalQ = quiz.questions.find((q) => q.id === r.questionId);
          if (!originalQ) return null;

          return (
            <div
              key={r.questionId}
              id={`review-question-${index}`}
              className="glass-panel"
              style={{
                padding: '24px',
                borderLeft: `4px solid ${r.isCorrect ? 'var(--success)' : 'var(--error)'}`
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: r.isCorrect ? 'var(--success)' : 'var(--error)' }}>
                  Question {index + 1} • {r.isCorrect ? 'Correct' : r.selectedOptionId ? 'Incorrect' : 'Unanswered'}
                </span>
                {r.source?.page && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Source: Page {r.source.page}
                  </span>
                )}
                {r.source?.slide && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Source: Slide {r.source.slide}
                  </span>
                )}
              </div>

              <h4 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '16px', lineHeight: 1.5 }}>
                {originalQ.question}
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {originalQ.options.map((opt) => {
                  const isCorrectAnswer = opt.id === r.correctOptionId;
                  const isUserSelection = opt.id === r.selectedOptionId;

                  let optBg = 'transparent';
                  let optBorder = 'var(--border-subtle)';
                  let optColor = 'var(--text-secondary)';

                  if (isCorrectAnswer) {
                    optBg = 'var(--success-bg)';
                    optBorder = 'var(--success)';
                    optColor = '#34d399';
                  } else if (isUserSelection && !r.isCorrect) {
                    optBg = 'var(--error-bg)';
                    optBorder = 'var(--error)';
                    optColor = '#f87171';
                  }

                  return (
                    <div
                      key={opt.id}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        border: `1px solid ${optBorder}`,
                        background: optBg,
                        color: optColor,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <span style={{ fontWeight: 700, textTransform: 'uppercase' }}>{opt.id}.</span>
                      <span style={{ flex: 1 }}>{opt.text}</span>
                      {isCorrectAnswer && <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Correct Answer</span>}
                      {isUserSelection && !r.isCorrect && <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Your Choice</span>}
                    </div>
                  );
                })}
              </div>

              {r.explanation && (
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(99, 102, 241, 0.08)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    fontSize: '0.85rem',
                    lineHeight: 1.5
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--accent-primary)', marginBottom: '4px' }}>
                    <BookOpen size={14} /> Grounded Source Explanation
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>{r.explanation}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
