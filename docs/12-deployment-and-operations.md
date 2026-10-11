# 12 --- Deployment and Operations

## 1. Initial deployment target

The first release is a local demonstration on a developer machine. Paid
cloud deployment is not part of the agreed initial scope. If a course
rubric explicitly requires cloud hosting, revise this document with the
team before choosing a provider.

## 2. Operational checks

-   Backend health endpoint reports process health without exposing
    secrets.
-   Verify database connectivity separately from liveness if readiness
    reporting is needed.
-   Check Ollama availability and selected model tag.
-   Enforce timeouts on parsing and generation.
-   Keep upload size and generated-output limits.
-   Handle expired sessions with a clear UI path to start again.

## 3. Resource considerations

-   Model performance depends on the selected Qwen3 variant and
    hardware.
-   Measure cold-start and warm generation latency.
-   Avoid simultaneous unbounded model requests; add a queue or
    concurrency limit if testing shows contention.
-   Bound extracted text, context length, output size, and retry count.

## 4. Logs and diagnostics

Safe telemetry can include request ID, route, status code, duration,
error category, generation latency/retry count, and cleanup totals.
Never log content or credentials.

## 5. Backup and recovery

QuizBuzz AI does not retain documents, quizzes, scores, or attempts, so
those are not backed up. PostgreSQL contains only session metadata. A
database reset or backend restart may invalidate active sessions; this
is acceptable for the local demo and must be explained in the UI/docs.

## 6. Release checklist

-   [ ] Fresh clone setup works.
-   [ ] `.env.example` is complete.
-   [ ] No secrets or test documents are committed.
-   [ ] CI is green.
-   [ ] Upload and expiry cleanup tested.
-   [ ] Model tag and settings documented.
-   [ ] Practice, exam, timer, and scoring smoke-tested.
-   [ ] Limitations are visible in README/demo presentation.
