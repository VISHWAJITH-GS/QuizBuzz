import React, { useState, useEffect } from 'react';
import { Zap, ShieldCheck, RefreshCw } from 'lucide-react';
import { UploadView } from './components/UploadView.js';
import { PreviewView } from './components/PreviewView.js';
import { QuizConfigView } from './components/QuizConfigView.js';
import { QuizRunnerView } from './components/QuizRunnerView.js';
import { ResultsView } from './components/ResultsView.js';
import { api } from './api/client.js';
import type {
  DocumentMetadata,
  QuizResponse,
  QuizSourceSelection,
  QuizSubmissionResult
} from '@quizbuzz/shared';

type Step = 'upload' | 'preview' | 'config' | 'quiz' | 'results';

export const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [document, setDocument] = useState<DocumentMetadata | null>(null);
  const [sourceSelection, setSourceSelection] = useState<QuizSourceSelection>({ type: 'document' });
  const [activeQuiz, setActiveQuiz] = useState<QuizResponse | null>(null);
  const [quizResult, setQuizResult] = useState<QuizSubmissionResult | null>(null);

  // Check if session or quiz exists on startup
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const docRes = await api.getCurrentDocument();
        if (docRes?.document) {
          setDocument(docRes.document);
          setCurrentStep('preview');

          // Check if active quiz was in progress
          try {
            const quizRes = await api.getCurrentQuiz();
            if (quizRes?.questions?.length) {
              setActiveQuiz(quizRes);
              setCurrentStep('quiz');
            }
          } catch {
            // No active quiz, stay at preview
          }
        }
      } catch {
        // No active document/session, stay on upload
      }
    };

    bootstrap();
  }, []);

  const handleDocumentUploaded = (doc: DocumentMetadata) => {
    setDocument(doc);
    setCurrentStep('preview');
  };

  const handleSourceSelected = (selection: QuizSourceSelection) => {
    setSourceSelection(selection);
    setCurrentStep('config');
  };

  const handleQuizGenerated = (quiz: QuizResponse) => {
    setActiveQuiz(quiz);
    setCurrentStep('quiz');
  };

  const handleQuizSubmitted = (result: QuizSubmissionResult) => {
    setQuizResult(result);
    setCurrentStep('results');
  };

  const handleResetSession = async () => {
    await api.deleteSession();
    setDocument(null);
    setActiveQuiz(null);
    setQuizResult(null);
    setCurrentStep('upload');
  };

  const stepsList: { key: Step; label: string }[] = [
    { key: 'upload', label: 'Upload' },
    { key: 'preview', label: 'Preview' },
    { key: 'config', label: 'Configure' },
    { key: 'quiz', label: 'Quiz' },
    { key: 'results', label: 'Results' }
  ];

  const currentStepIndex = stepsList.findIndex((s) => s.key === currentStep);

  return (
    <div>
      {/* Top Header */}
      <header className="app-header">
        <div className="header-container">
          <div className="logo-badge">
            <div className="logo-icon">
              <Zap size={20} />
            </div>
            <div>
              <div className="logo-title">QuizBuzz AI</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Document-Grounded Exam Prep</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={14} color="var(--success)" /> Zero-Data-Persistence
            </span>
            <button
              id="btn-reset-session"
              className="btn-secondary"
              onClick={handleResetSession}
              style={{ fontSize: '0.8rem', padding: '6px 14px' }}
            >
              <RefreshCw size={12} /> New Session
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="main-content">
        {/* Progress Stepper */}
        <nav className="steps-nav" aria-label="Progress">
          {stepsList.map((step, idx) => {
            const isDone = idx < currentStepIndex;
            const isActive = idx === currentStepIndex;

            return (
              <React.Fragment key={step.key}>
                <div className={`step-indicator ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}>
                  <div className="step-number">{idx + 1}</div>
                  <span>{step.label}</span>
                </div>
                {idx < stepsList.length - 1 && <div className="step-divider" />}
              </React.Fragment>
            );
          })}
        </nav>

        {/* Step Views */}
        {currentStep === 'upload' && (
          <UploadView onDocumentUploaded={handleDocumentUploaded} />
        )}

        {currentStep === 'preview' && document && (
          <PreviewView
            document={document}
            onContinue={handleSourceSelected}
            onReset={() => {
              setDocument(null);
              setCurrentStep('upload');
            }}
          />
        )}

        {currentStep === 'config' && (
          <QuizConfigView
            sourceSelection={sourceSelection}
            onQuizGenerated={handleQuizGenerated}
            onBack={() => setCurrentStep('preview')}
          />
        )}

        {currentStep === 'quiz' && activeQuiz && (
          <QuizRunnerView
            quiz={activeQuiz}
            onSubmitCompleted={handleQuizSubmitted}
            onDiscard={() => {
              setActiveQuiz(null);
              setCurrentStep('preview');
            }}
          />
        )}

        {currentStep === 'results' && activeQuiz && quizResult && (
          <ResultsView
            quiz={activeQuiz}
            result={quizResult}
            onRetake={() => setCurrentStep('config')}
            onUploadNew={handleResetSession}
          />
        )}
      </main>
    </div>
  );
};
