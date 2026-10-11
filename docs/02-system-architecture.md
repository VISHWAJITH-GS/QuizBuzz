# 02 --- System Architecture

## 1. High-level components

-   **Frontend:** React, TypeScript, Vite. Owned primarily by Member 1.
-   **Backend API:** Node.js, Express, TypeScript. Owned primarily by
    Member 2.
-   **Document parsers:** format-specific libraries for PDF, DOCX, TXT,
    and PPTX.
-   **Local model runtime:** Ollama serving a Qwen3 model selected after
    benchmarking.
-   **Database:** PostgreSQL for session ID, creation time, and expiry
    time only.
-   **Temporary state:** server memory or non-persistent temporary
    files; browser `sessionStorage` for same-tab quiz recovery.
-   **Engineering tooling:** Git/GitHub, Docker Compose, GitHub Actions.

## 2. Request flow

1.  The browser creates or obtains an opaque session.
2.  The student uploads a document.
3.  The backend validates file type and size, extracts text, and records
    available page/slide boundaries.
4.  The frontend displays extracted text and detected sections.
5.  The student selects a section and quiz configuration.
6.  The backend sends bounded source text and a constrained prompt to
    Ollama.
7.  The backend parses and validates the response, checks grounding and
    duplicates, and stores the answer key only in temporary state.
8.  The frontend renders the quiz.
9.  The student answers questions; the backend or a shared trusted
    scoring module calculates the result using the hidden answer key.
10. The result is returned for display. On expiry/deletion, temporary
    server state and files are removed.

## 3. Logical diagram

``` mermaid
flowchart TD
    U[Student] --> FE[React + TypeScript + Vite]
    FE --> API[Express + TypeScript API]
    API --> DOC[Document validation and extraction]
    DOC --> TEMP[Temporary session state]
    API --> DB[(PostgreSQL: session metadata only)]
    API --> GEN[Prompting and output validation]
    GEN --> OLLAMA[Ollama + selected Qwen3 model]
    OLLAMA --> GEN
    GEN --> TEMP
    TEMP --> SCORE[Quiz and scoring logic]
    SCORE --> API
    API --> FE
```

## 4. Architectural boundaries

-   The frontend is responsible for presentation and user interactions,
    not for deciding the correct answer.
-   The backend validates every request and owns answer keys and scoring
    rules.
-   PostgreSQL must never become a document or quiz-content store.
-   The model output is untrusted input. Parse and validate it as data;
    do not execute generated code or instructions.
-   The exact model variant, context length, parser packages, and
    request limits should be selected through small benchmarks and
    tests.

## 5. Failure handling

-   Invalid upload: return a clear client error.
-   No extractable text: explain that the file is unsupported or likely
    scanned; do not silently invoke OCR.
-   Too little source material: generate fewer questions or explain that
    no reliable quiz can be produced.
-   Ollama unavailable or generation invalid: retry recoverable errors
    up to three times after the first attempt, then return a clear
    error.
-   Expired or unknown session: return an explicit expired-session
    response and ask the user to upload again.
-   Backend restart: temporary server state may be lost; the local-demo
    documentation must disclose this limitation.

## 6. Architecture decisions to record

When the team makes a decision, update this file or add an ADR: - Exact
Qwen3 Ollama tag and generation settings. - Temporary state
representation and size limits. - Whether scoring is implemented in a
dedicated module or route service. - Exact session expiration policy.
