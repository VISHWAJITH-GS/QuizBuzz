import React, { useState } from 'react';
import {
  Sparkles,
  Clock,
  Award,
  BookOpen,
  AlertCircle,
  Loader2,
  FileText,
  Eye,
  EyeOff,
  RefreshCw,
  Layers
} from 'lucide-react';
import { api } from '../api/client.js';
import type {
  DocumentMetadata,
  QuizConfigRequest,
  QuizDifficulty,
  QuizMode,
  QuizNavigation,
  QuizResponse,
  QuizSourceSelection
} from '@quizbuzz/shared';

interface QuizConfigViewProps {
  document: DocumentMetadata;
  onQuizGenerated: (quiz: QuizResponse) => void;
  onChangeDocument: () => void;
}

export const QuizConfigView: React.FC<QuizConfigViewProps> = ({
  document,
  onQuizGenerated,
  onChangeDocument
}) => {
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [sourceType, setSourceType] = useState<'document' | 'section'>('document');
  const [selectedSectionId, setSelectedSectionId] = useState<string>(
    document.sections[0]?.id || ''
  );

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

    const sourceSelection: QuizSourceSelection =
      sourceType === 'document'
        ? { type: 'document' }
        : { type: 'section', sectionId: selectedSectionId };

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
    <div className="animate-fade-in" style={{ maxWidth: '760px', margin: '0 auto' }}>
      {/* Top Document Summary Card */}
      <div
        className="glass-panel"
        style={{
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#18181b'
            }}
          >
            <FileText size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#09090b' }}>
              {document.name}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {document.characterCount.toLocaleString()} characters • {document.sections.length} section(s)
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            id="btn-toggle-preview"
            type="button"
            className="btn-secondary"
            style={{ fontSize: '0.85rem', padding: '7px 14px' }}
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
            {showPreview ? 'Hide Preview' : 'View Preview'}
          </button>
          <button
            id="btn-change-doc"
            type="button"
            className="btn-secondary"
            style={{ fontSize: '0.85rem', padding: '7px 14px' }}
            onClick={onChangeDocument}
          >
            <RefreshCw size={13} /> Change File
          </button>
        </div>
      </div>

      {/* Optional Document Text Preview Drawer (Shown only when user wants it) */}
      {showPreview && (
        <div
          id="preview-collapsible-panel"
          className="glass-panel animate-fade-in"
          style={{
            padding: '20px',
            marginBottom: '24px',
            background: '#ffffff',
            border: '1.5px solid #cbd5e1'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#18181b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Document Text Preview
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              First 2,000 characters
            </span>
          </div>
          <div
            id="text-preview-box"
            style={{
              background: 'var(--bg-input)',
              borderRadius: 'var(--radius-sm)',
              padding: '16px',
              maxHeight: '260px',
              overflowY: 'auto',
              fontSize: '0.9rem',
              lineHeight: '1.6',
              color: 'var(--text-secondary)',
              whiteSpace: 'pre-wrap',
              border: '1px solid var(--border-subtle)'
            }}
          >
            {document.preview}
          </div>
        </div>
      )}

      {/* Main Configuration Card */}
      <div className="glass-panel" style={{ padding: '32px' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '6px' }}>Quiz Configuration</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '24px' }}>
          Select the scope, difficulty, and examination settings for your quiz.
        </p>

        {/* Section / Scope Picker if multiple sections are detected */}
        {document.sections.length > 1 && (
          <div style={{ marginBottom: '28px', paddingBottom: '24px', borderBottom: '1px solid var(--border-subtle)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: 600, marginBottom: '12px', color: 'var(--text-secondary)' }}>
              <Layers size={16} /> Question Source Scope
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: sourceType === 'section' ? '12px' : '0' }}>
              <label
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: `1.5px solid ${sourceType === 'document' ? '#18181b' : 'var(--border-subtle)'}`,
                  background: sourceType === 'document' ? '#f1f5f9' : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <input
                  type="radio"
                  name="source-type"
                  checked={sourceType === 'document'}
                  onChange={() => setSourceType('document')}
                  style={{ accentColor: '#18181b' }}
                />
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Whole Document</span>
              </label>

              <label
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: `1.5px solid ${sourceType === 'section' ? '#18181b' : 'var(--border-subtle)'}`,
                  background: sourceType === 'section' ? '#f1f5f9' : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <input
                  type="radio"
                  name="source-type"
                  checked={sourceType === 'section'}
                  onChange={() => setSourceType('section')}
                  style={{ accentColor: '#18181b' }}
                />
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Specific Section</span>
              </label>
            </div>

            {sourceType === 'section' && (
              <select
                id="section-select-dropdown"
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.9rem'
                }}
              >
                {document.sections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.title} {sec.startPage ? `(Page ${sec.startPage})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Difficulty */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '10px', color: 'var(--text-secondary)' }}>
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
                  border: `1.5px solid ${difficulty === diff ? '#18181b' : 'var(--border-subtle)'}`,
                  background: difficulty === diff ? '#18181b' : '#ffffff',
                  color: difficulty === diff ? '#ffffff' : 'var(--text-secondary)',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  transition: 'all 0.15s ease'
                }}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

        {/* Question Count */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Number of Questions
            </label>
            <span style={{ fontWeight: 700, color: '#18181b' }}>{questionCount}</span>
          </div>
          <input
            id="question-count-slider"
            type="range"
            min={1}
            max={50}
            value={questionCount}
            onChange={(e) => setQuestionCount(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#18181b', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            <span>1 Question</span>
            <span>25</span>
            <span>50 Questions</span>
          </div>
        </div>

        {/* Mode Selection */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '10px', color: 'var(--text-secondary)' }}>
            Quiz Mode
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <label
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                border: `1.5px solid ${mode === 'practice' ? '#18181b' : 'var(--border-subtle)'}`,
                background: mode === 'practice' ? '#f1f5f9' : 'transparent',
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
                style={{ marginTop: '4px', accentColor: '#18181b' }}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BookOpen size={16} color="#18181b" /> Practice Mode
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Instant feedback and explanation after each question.
                </div>
              </div>
            </label>

            <label
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                border: `1.5px solid ${mode === 'exam' ? '#18181b' : 'var(--border-subtle)'}`,
                background: mode === 'exam' ? '#f1f5f9' : 'transparent',
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
                style={{ marginTop: '4px', accentColor: '#18181b' }}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Award size={16} color="#18181b" /> Exam Mode
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Answers stay hidden until final submission.
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Navigation & Optional Timer */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
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
                  border: `1px solid ${navigation === 'one-by-one' ? '#18181b' : 'var(--border-subtle)'}`,
                  background: navigation === 'one-by-one' ? '#18181b' : '#ffffff',
                  color: navigation === 'one-by-one' ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  fontWeight: 500
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
                  border: `1px solid ${navigation === 'all-at-once' ? '#18181b' : 'var(--border-subtle)'}`,
                  background: navigation === 'all-at-once' ? '#18181b' : '#ffffff',
                  color: navigation === 'all-at-once' ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  fontWeight: 500
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
                style={{ accentColor: '#18181b' }}
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
                    color: 'var(--text-primary)',
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
              Marks per Correct
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
                color: 'var(--text-primary)',
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
                color: 'var(--text-primary)',
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
              border: '1px solid #fecaca',
              color: '#991b1b',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '20px'
            }}
          >
            <AlertCircle size={18} color="var(--error)" />
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{error}</span>
          </div>
        )}

        <button
          id="btn-generate-quiz"
          type="button"
          className="btn-primary"
          onClick={handleGenerate}
          disabled={loading}
          style={{ width: '100%', justifyContent: 'center', padding: '14px' }}
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
  );
};
