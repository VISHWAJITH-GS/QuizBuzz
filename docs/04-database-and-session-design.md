# 04 --- Database and Session Design

## 1. Persistence rule

PostgreSQL stores **only**: - session ID - creation timestamp - expiry
timestamp

Do not add tables or columns for users, filenames, document text,
extracted text, generated questions, answer keys, selected answers,
scores, or quiz history.

## 2. Proposed schema

Use the SQL below as a starting point; adjust types and naming during
implementation without expanding the permitted stored data.

``` sql
CREATE TABLE sessions (
    session_id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX sessions_expires_at_idx ON sessions (expires_at);
```

Generate IDs using a cryptographically secure random generator. Do not
use predictable sequential IDs.

## 3. Session lifecycle

1.  Create a session and persist only its ID and timestamps.
2.  Associate temporary in-memory state with that session.
3.  Validate session existence and expiry on every content operation.
4.  Refresh expiry on valid activity if sliding expiration is selected.
5.  On explicit deletion, remove temporary content/files and delete the
    session row.
6.  Periodically remove expired rows and associated temporary data.
7.  When the backend restarts, active in-memory state may be lost;
    handle this as an expired/unavailable session.

A proposed inactivity timeout is 30 minutes. Make it configurable and
document the final chosen value.

## 4. Temporary content

Temporary content may include: - uploaded file bytes - extracted text
and section metadata - generated questions and answer keys - in-progress
answers and timer metadata - computed result during the active session

Prefer in-memory state for a local demo when practical. If temporary
files are needed, store them outside the repository in a dedicated
temporary directory, use random names, restrict access, and delete them
on expiry/deletion. Do not treat a persistent Docker volume as temporary
storage.

## 5. Browser session storage

Use `sessionStorage` only for the minimum quiz state needed to recover a
refresh in the same tab. Do not use `localStorage` for document or quiz
content. Clear stored quiz state when a new quiz replaces the previous
one, when the session is deleted, and when the app detects expiry.

Browser storage behavior can vary; do not promise that tab closure
triggers guaranteed server-side deletion. Server-side expiry and cleanup
are required independently.

## 6. Cleanup job

Implement a periodic cleanup routine that: - finds expired sessions, -
deletes temporary files/state associated with those sessions, - deletes
expired PostgreSQL rows, - logs only counts, duration, and error
category.

Make cleanup idempotent and safe if run more than once. A database row
expiring does not automatically delete files or in-memory objects.

## 7. Environment variables

Use an `.env.example` with placeholders, for example: - `DATABASE_URL` -
`SESSION_TTL_MINUTES` - `CLEANUP_INTERVAL_MINUTES` - `TEMP_UPLOAD_DIR` -
`OLLAMA_BASE_URL` - `OLLAMA_MODEL`

Never commit a real `.env` file or credentials.
