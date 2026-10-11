import React, { useState } from 'react';
import { Sparkles, Clock, Award, BookOpen, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../api/client.js';
import type {
  QuizConfigRequest,
  QuizDifficulty,
  QuizMode,
  QuizNavigation,
  QuizResponse,
  QuizSourceSelection
} from '@quizbuzz/shared';

interface QuizConfigViewProps {
  sourceSelection: QuizSourceSelection;
  onQuizGenerated: (quiz: QuizResponse) => void;
  onBack: () => void;
}

export const QuizConfigView: React.FC<QuizConfigViewProps> = ({
  sourceSelection,
  onQuizGenerated,
  onBack
}) => {
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<QuizDifficulty>('medium');
  const [mode, setMode] = useState<QuizMode>('practice');
  const [navigation, setNavigation] = useState<QuizNavigation>('one-by-one');
  const [enableTimer, setEnableTimer] = useState<boolean>(false);
  const [timerMinutes, setTimerMinutes] = useState<number>(10);
  const [marksPerCorrect, setMarksPerCorrect] = useState<number>(1);
  const [negativeMarks, setNegativeMarks] = useState<number>(0);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setError(null);
    setLoading(true);

    const config: QuizConfigRequest = {
      source: sourceSelection,
      questionCount,
      difficulty,
      mode,
      navigation,
      timerSeconds: enableTimer ? timerMinutes * 60 : null,
      marksPerCorrect,
      negativeMarksPerIncorrect: negativeMarks
    };

    try {
      const res = await api.generateQuiz(config);
      onQuizGenerated(res);
    } catch (err: any) {
      const msg = err?.error?.message || 'Failed to generate quiz. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '720px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>Configure Your Quiz</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Customize questions count, difficulty, examination mode, and rules.
        </p>
      </div>

      <div className="glass-panel" style={{ padding: '32px' }}>
        {/* Difficulty */}
        <div style={{ marginBottom: '28px' }}>
          <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '12px', color: 'var(--text-secondary)' }}>
            Difficulty Level
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {(['easy', 'medium', 'hard'] as QuizDifficulty[]).map((diff) => (
              <button
                key={diff}
                id={`btn-diff-${diff}`}
                type="button"
                onClick={() => setDifficulty(diff)}
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: `1.5px solid ${difficulty === diff ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                  background: difficulty === diff ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-card)',
                  color: difficulty === diff ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: 600,
                  textTransform: 'capitalize'
                }}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

        {/* Question Count */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Number of Questions
            </label>
            <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{questionCount}</span>
          </div>
          <input
            id="question-count-slider"
            type="range"
            min={1}
            max={50}
            value={questionCount}
            onChange={(e) => setQuestionCount(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            <span>1 Question</span>
            <span>25</span>
            <span>50 Questions</span>
          </div>
        </div>

        {/* Mode Selection */}
        <div style={{ marginBottom: '28px' }}>
          <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '12px', color: 'var(--text-secondary)' }}>
            Quiz Mode
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <label
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                border: `1.5px solid ${mode === 'practice' ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                background: mode === 'practice' ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
              }}
            >
              <input
                type="radio"
                name="quiz-mode"
                checked={mode === 'practice'}
                onChange={() => setMode('practice')}
                style={{ marginTop: '4px' }}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BookOpen size={16} color="var(--accent-primary)" /> Practice Mode
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Immediate feedback, explanations, and learning notes after each answer.
                </div>
              </div>
            </label>

            <label
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                border: `1.5px solid ${mode === 'exam' ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                background: mode === 'exam' ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
              }}
            >
              <input
                type="radio"
                name="quiz-mode"
                checked={mode === 'exam'}
                onChange={() => setMode('exam')}
                style={{ marginTop: '4px' }}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Award size={16} color="#d946ef" /> Exam Mode
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Answers and feedback stay strictly hidden until final submission.
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Navigation & Optional Timer */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
              Navigation Layout
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setNavigation('one-by-one')}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${navigation === 'one-by-one' ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                  background: navigation === 'one-by-one' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  color: navigation === 'one-by-one' ? 'white' : 'var(--text-secondary)',
                  fontSize: '0.85rem'
                }}
              >
                One-by-One
              </button>
              <button
                type="button"
                onClick={() => setNavigation('all-at-once')}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${navigation === 'all-at-once' ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                  background: navigation === 'all-at-once' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  color: navigation === 'all-at-once' ? 'white' : 'var(--text-secondary)',
                  fontSize: '0.85rem'
                }}
              >
                All-at-Once
              </button>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} /> Countdown Timer
              </label>
              <input
                type="checkbox"
                id="enable-timer-checkbox"
                checked={enableTimer}
                onChange={(e) => setEnableTimer(e.target.checked)}
              />
            </div>
            {enableTimer ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={timerMinutes}
                  onChange={(e) => setTimerMinutes(Math.max(1, Number(e.target.value)))}
                  style={{
                    width: '70px',
                    padding: '8px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-input)',
                    color: 'white',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.9rem'
                  }}
                />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>minutes</span>
              </div>
            ) : (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', paddingTop: '8px' }}>
                Untimed quiz session
              </div>
            )}
          </div>
        </div>

        {/* Scoring settings */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
              Marks per Correct Answer
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={marksPerCorrect}
              onChange={(e) => setMarksPerCorrect(Math.max(0, Number(e.target.value)))}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-input)',
                color: 'white',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
              Negative Marks per Incorrect
            </label>
            <input
              type="number"
              min={0}
              max={5}
              step={0.25}
              value={negativeMarks}
              onChange={(e) => setNegativeMarks(Math.max(0, Number(e.target.value)))}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-input)',
                color: 'white',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.9rem'
              }}
            />
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--error-bg)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '20px'
            }}
          >
            <AlertCircle size={18} color="var(--error)" />
            <span style={{ fontSize: '0.9rem' }}>{error}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: '14px' }}>
          <button type="button" className="btn-secondary" onClick={onBack} disabled={loading}>
            Back
          </button>
          <button
            id="btn-generate-quiz"
            type="button"
            className="btn-primary"
            onClick={handleGenerate}
            disabled={loading}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} /> Generating Grounded Questions...
              </>
            ) : (
              <>
                <Sparkles size={18} /> Generate Quiz
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
