# 01 --- Requirements

## 1. Purpose

QuizBuzz AI helps college students test their understanding of study
material by generating multiple-choice quizzes grounded in an uploaded
document.

## 2. Users and scope

-   Audience: college students.
-   Application: desktop-first web app.
-   Initial deployment: local demonstration; no paid cloud service
    required.
-   Authentication: none.
-   Language: English only.
-   Question type: multiple-choice questions (MCQs) only.

## 3. Functional requirements

### Document upload and preview

-   Accept PDF, DOCX, TXT, and PPTX.
-   Enforce a 10 MB maximum upload size.
-   Reject unsupported, malformed, empty, or image-only/scanned
    documents that require OCR.
-   Extract readable text and preserve page/slide boundaries where the
    parser exposes them.
-   Let the student preview extracted text before generating a quiz.
-   Let the student choose the whole document or detected
    sections/chapters.
-   If headings cannot be reliably detected, offer the whole document
    and a fallback selection method such as page range where available.
-   Keep source-page references only when they can be mapped reliably;
    never invent page numbers.

### Quiz configuration and generation

-   Student selects difficulty: easy, medium, or hard.
-   Student selects a requested question count from 1 to 50.
-   Generate questions based on the amount and quality of source
    content.
-   If the document/selection does not contain enough distinct
    information, return fewer questions and explain why.
-   Each question must have four options, exactly one correct answer, an
    explanation, and a source page reference when available.
-   Validate the model response structure, source grounding, and
    duplicate questions before presenting the quiz.
-   Use Ollama with a Qwen3 model; choose the exact model tag after
    benchmarking on the target machine.
-   For recoverable generation errors, perform the initial attempt plus
    up to three retries. After that, return a clear error; do not
    substitute a sample quiz.

### Taking a quiz

-   Support question-by-question and all-questions-at-once navigation.
-   Practice mode reveals correctness and explanation immediately after
    an answer.
-   Exam mode hides correctness until submission.
-   Timer is optional; if enabled, the student selects the duration
    before starting.
-   Configure marks per correct answer and optional negative marking per
    incorrect answer.
-   A new quiz immediately replaces and discards the prior in-progress
    quiz without a confirmation dialog.
-   Keep browser-side quiz progress in `sessionStorage` so a refresh in
    the same tab can recover it.
-   Do not maintain permanent quiz or attempt history.

### Results

-   Show total score and percentage, correct/incorrect counts, correct
    answers, explanations, and available source references.
-   Topic-wise performance/weak-area insights are optional and should
    appear only if the system can derive them reliably.
-   If generation produced fewer questions than requested, clearly state
    that fact.

### Sessions and temporary data

-   Use opaque, cryptographically secure session IDs.
-   PostgreSQL stores only session ID, creation time, and expiry time.
-   Uploaded files, extracted text, generated quizzes, answer keys,
    responses, and scores must not be permanently stored in PostgreSQL
    or other persistent application storage.
-   Keep temporary server-side content in memory or explicitly temporary
    storage.
-   Provide explicit session deletion and configurable inactivity
    expiry. A 30-minute inactivity timeout is a proposed default, to be
    confirmed during implementation.
-   Run periodic cleanup for expired session rows and temporary files.
-   A backend restart may lose active quiz state in the local-demo
    version.

## 4. Non-functional requirements

-   Clear validation errors and actionable failure messages.
-   Keep the local app usable on a typical student laptop; benchmark the
    model before fixing the exact Qwen3 tag.
-   Avoid logging document contents, extracted text, generated
    questions, answers, scores, session tokens, or credentials.
-   Include health checks, automated tests, and reproducible local
    setup.
-   Keep components and APIs understandable for a student project and
    team handoff.

## 5. Acceptance criteria

-   Valid supported files up to 10 MB can be uploaded and previewed.
-   Unsupported or unreadable files fail with a clear message.
-   The user can generate and take a grounded MCQ quiz from all or
    selected source content.
-   Questions have four options, one answer key, an explanation, and
    only reliable source references.
-   Practice and exam modes behave differently as specified.
-   Scoring supports configurable correct marks and optional negative
    marking.
-   Expired sessions and temporary files are cleaned up.
-   PostgreSQL contains only the approved session metadata.
-   A clean checkout can be run locally using the documented steps.
-   CI runs the agreed automated checks.

## 6. Out of scope for the first version

-   User accounts, login, profiles, or permanent attempt history.
-   OCR for scanned/image-only files.
-   Non-English quiz generation or question types other than MCQs.
-   Paid hosted AI APIs.
-   Production multi-user cloud deployment unless separately required by
    the assignment.
