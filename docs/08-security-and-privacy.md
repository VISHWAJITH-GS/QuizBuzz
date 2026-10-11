# 08 --- Security and Privacy

## 1. Data minimization

No user accounts. PostgreSQL stores only session ID, creation time, and
expiry time. Documents, extracted text, generated questions, answer
keys, answers, scores, and attempt history are temporary only.

## 2. Session protection

-   Generate opaque session identifiers with a cryptographically secure
    random source.
-   Validate the active session and expiry on every document/quiz
    request.
-   Never authorize access solely because a client knows a document ID.
-   Avoid placing session tokens in URLs.
-   If cookies are used, set appropriate `HttpOnly`, `SameSite`, and
    `Secure` attributes for the environment; local HTTP development may
    need a documented development configuration.
-   Clear session and temporary state on explicit deletion and expiry.

## 3. Upload protection

-   Maximum file size 10 MB.
-   Allow-list supported types and verify actual content where
    practical.
-   Use random server-side filenames and prevent path traversal.
-   Store temporary uploads outside the public web root and outside
    version control.
-   Apply parser limits, timeouts, and robust exception handling.
-   Reject scanned/image-only PDFs requiring OCR.
-   Do not execute macros, embedded scripts, or uploaded content.

## 4. AI-specific safeguards

-   Treat document contents as untrusted data, not instructions.
-   Constrain output to a schema and validate all fields.
-   Never execute model-generated code.
-   Do not trust a generated source reference without checking it
    against known source metadata.
-   Keep the answer key server-side until reveal is allowed.

## 5. Logging

Allowed examples: - request ID, - route, - HTTP status, - duration, -
error category, - model duration and retry count, - cleanup counts and
duration.

Never log: - document or extracted text, - generated questions or
explanations, - answer keys, submitted answers, or scores, - session
IDs/tokens, - credentials or full environment variables.

## 6. Temporary deletion

-   Delete temporary content on explicit session deletion, document
    replacement, expiry, and recoverable processing failure.
-   Run periodic cleanup; browser closure alone is not a reliable
    deletion signal.
-   Avoid claiming guaranteed secure erasure from SSDs, operating
    systems, containers, or browser storage.
-   Document that a backend restart can invalidate in-memory sessions.

## 7. Secrets and repository hygiene

-   Commit `.env.example`, not `.env`.
-   Add `.env`, uploads, temporary files, model artifacts, logs, and
    build outputs to `.gitignore`.
-   Use GitHub Actions secrets only for actual CI secrets; do not
    introduce secrets that are unnecessary for the local project.
-   Keep dependencies updated and review upload/parser packages.

## 8. Privacy checklist

-   [ ] No content tables in PostgreSQL.
-   [ ] No content in logs or error traces returned to users.
-   [ ] Temporary data is deleted on expiry and explicit deletion.
-   [ ] New quiz clears previous quiz state.
-   [ ] Exam mode hides answers before submission.
-   [ ] Invalid/expired sessions cannot access content.
