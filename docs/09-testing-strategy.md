# 09 --- Testing Strategy

## 1. Goals

Test correctness, privacy constraints, failure handling, and repeatable
local setup. Suggested tools are Vitest for unit tests and Supertest for
Express integration tests; confirm versions and tooling when
initializing the repository.

## 2. Unit tests

### Configuration and validation

-   Valid/invalid question counts, difficulty, mode, timer, and marks.
-   Upload size and extension validation.
-   Session expiration calculations.
-   Score calculations with correct, incorrect, and unanswered
    questions.

### Document extraction

-   Valid PDF, DOCX, TXT, and PPTX.
-   Empty document and no extractable text.
-   Scanned/image-only PDF rejection.
-   Malformed files and parser exceptions.
-   Heading detection and fallback selection.
-   Reliable versus unavailable page/slide references.

### AI response validation

-   Valid schema.
-   Invalid JSON.
-   Missing fields.
-   Fewer/more than four options.
-   Zero or multiple correct options.
-   Duplicate options and duplicate questions.
-   Invalid source offsets/page references.
-   Insufficient source content.
-   Prompt-injection-like text inside the document.

## 3. API integration tests

-   Session creation, validation, expiry, and deletion.
-   Upload and preview flow.
-   Quiz generation with a mocked Ollama client.
-   Model unavailable, timeout, malformed response, and retry
    exhaustion.
-   Practice mode reveals feedback at the right time.
-   Exam mode does not expose correct answers before submission.
-   Server computes scores; client cannot supply an authoritative score.
-   New quiz clears previous quiz state.
-   Expired session cannot retrieve prior document or quiz data.
-   Health endpoint does not reveal secrets.

## 4. Privacy tests

-   Assert PostgreSQL schema and queries contain only allowed session
    metadata.
-   Ensure request/error logs do not include document content,
    questions, answers, tokens, or credentials.
-   Confirm temporary files are deleted on expiry and explicit deletion.
-   Confirm failure paths clean up partial uploads.
-   Confirm `.env` and sample documents are excluded from Git.

## 5. Frontend tests

-   Upload progress and validation errors.
-   Extracted text preview and section selection.
-   Quiz configuration validation.
-   Both navigation modes.
-   Practice/exam behavior.
-   Timer expiry and refresh recovery.
-   Result rendering and source references.
-   Clear previous quiz when starting a new one.

## 6. End-to-end smoke test

1.  Start PostgreSQL, backend, Ollama, and frontend.
2.  Create a session.
3.  Upload a small test document.
4.  Preview extracted text and select a section.
5.  Generate a small quiz.
6.  Verify four options, explanation, and available source reference.
7.  Complete practice and exam-mode quizzes.
8.  Verify scoring.
9.  Delete the session and confirm cleanup.
10. Restart the backend and verify the documented active-session
    behavior.

Use synthetic or non-sensitive test documents.

## 7. CI checks

-   Install dependencies using lockfiles.
-   Lint and type-check.
-   Run unit and integration tests.
-   Build frontend and backend.
-   Do not require a GPU or live Ollama model in every CI run; mock the
    model client in normal CI and keep an optional manual model smoke
    test.
