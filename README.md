# QuizBuzz AI

QuizBuzz AI turns study documents into document-grounded multiple-choice
quizzes so college students can check their understanding.

## Documentation index

1.  [Requirements](docs/01-requirements.md)
2.  [System architecture](docs/02-system-architecture.md)
3.  [API contract](docs/03-api-contract.md)
4.  [Database and session
    design](docs/04-database-and-session-design.md)
5.  [Document processing](docs/05-document-processing.md)
6.  [AI quiz generation](docs/06-ai-quiz-generation.md)
7.  [Scoring and quiz rules](docs/07-scoring-and-quiz-rules.md)
8.  [Security and privacy](docs/08-security-and-privacy.md)
9.  [Testing strategy](docs/09-testing-strategy.md)
10. [Docker and local
    development](docs/10-docker-and-local-development.md)
11. [CI/CD pipeline](docs/11-ci-cd-pipeline.md)
12. [Deployment and operations](docs/12-deployment-and-operations.md)
13. [Team workflow](docs/13-team-workflow.md)

## Initial scope

-   Desktop-first web application for a local demonstration.
-   Upload PDF, DOCX, TXT, and PPTX documents up to 10 MB.
-   Extract and preview text; allow full-document or section-based
    selection.
-   Generate English MCQs using a local Ollama-served Qwen3 model.
-   Support practice and exam modes, optional timer, configurable marks,
    and optional negative marking.
-   Store only session metadata in PostgreSQL. Do not permanently store
    uploaded documents, extracted text, quizzes, answers, scores, or
    attempt history.
-   No user accounts or login.

## Important implementation notes

-   Treat this repository as the source of truth; update these documents
    when a team decision changes.
-   Model tag, package versions, exact endpoint schemas, and deployment
    details should be finalized and tested during implementation.
-   Do not commit `.env`, credentials, uploaded study documents,
    extracted text, or generated quiz content.
-   The backend may keep temporary state in memory for the local demo. A
    backend restart can invalidate active sessions.
