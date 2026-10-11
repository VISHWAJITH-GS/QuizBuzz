import React, { useState, useEffect } from 'react';
import { UploadView } from './components/UploadView.js';
import { QuizConfigView } from './components/QuizConfigView.js';
import { QuizRunnerView } from './components/QuizRunnerView.js';
import { ResultsView } from './components/ResultsView.js';
import { api } from './api/client.js';
import type {
  DocumentMetadata,
  QuizResponse,
  QuizSubmissionResult
} from '@quizbuzz/shared';

type Step = 'upload' | 'config' | 'quiz' | 'results';

export const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [document, setDocument] = useState<DocumentMetadata | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<QuizResponse | null>(null);
  const [quizResult, setQuizResult] = useState<QuizSubmissionResult | null>(null);

  // Check if session or quiz exists on startup
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const docRes = await api.getCurrentDocument();
        if (docRes?.document) {
          setDocument(docRes.document);
          setCurrentStep('config');

          // Check if active quiz was in progress
          try {
            const quizRes = await api.getCurrentQuiz();
            if (quizRes?.questions?.length) {
              setActiveQuiz(quizRes);
              setCurrentStep('quiz');
            }
          } catch {
            // Stay at config
          }
        }
      } catch {
        // No active document, stay on upload
      }
    };

    bootstrap();
  }, []);

  const handleDocumentUploaded = (doc: DocumentMetadata) => {
    setDocument(doc);
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

  const handleChangeDocument = async () => {
    try {
      await api.deleteDocument();
    } catch {
      // ignore
    }
    setDocument(null);
    setActiveQuiz(null);
    setQuizResult(null);
    setCurrentStep('upload');
  };

  const stepsList: { key: Step; label: string }[] = [
    { key: 'upload', label: 'Upload' },
    { key: 'config', label: 'Configure' },
    { key: 'quiz', label: 'Quiz' },
    { key: 'results', label: 'Results' }
  ];

  const currentStepIndex = stepsList.findIndex((s) => s.key === currentStep);

  return (
    <div>
      {/* Top Header - Clean and Minimalist */}
      <header className="app-header">
        <div className="header-container">
          <div className="logo-badge">
            <img
              src="/logo.png"
              alt="QuizBuzz Logo"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                objectFit: 'contain'
              }}
            />
            <div>
              <div className="logo-title">QuizBuzz AI</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Document-Grounded Exam Prep
              </div>
            </div>
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

        {currentStep === 'config' && document && (
          <QuizConfigView
            document={document}
            onQuizGenerated={handleQuizGenerated}
            onChangeDocument={handleChangeDocument}
          />
        )}

        {currentStep === 'quiz' && activeQuiz && (
          <QuizRunnerView
            quiz={activeQuiz}
            onSubmitCompleted={handleQuizSubmitted}
            onDiscard={() => {
              setActiveQuiz(null);
              setCurrentStep('config');
            }}
          />
        )}

        {currentStep === 'results' && activeQuiz && quizResult && (
          <ResultsView
            quiz={activeQuiz}
            result={quizResult}
            onRetake={() => setCurrentStep('config')}
            onUploadNew={handleChangeDocument}
          />
        )}
      </main>
    </div>
  );
};
