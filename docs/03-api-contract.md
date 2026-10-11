# 03 --- API Contract

> This is a proposed contract for frontend/backend coordination. Agree
> on request and response schemas together before implementing routes.
> Endpoint names may change by mutual agreement, but privacy and
> validation requirements must not.

## 1. Conventions

-   Base path: `/api/v1`
-   Content type: JSON except multipart upload.
-   All content routes require a valid opaque session ID, preferably
    through a secure same-origin cookie or a carefully handled header.
    Final transport must be agreed by the team.
-   Never put document content or answer keys in URLs.
-   Use consistent error JSON:

``` json
{
  "error": {
    "code": "INVALID_FILE",
    "message": "The file could not be processed.",
    "requestId": "request-id"
  }
}
```

Do not include internal stack traces, source text, prompts, tokens, or
answer keys in errors.

## 2. Proposed endpoints

  ----------------------------------------------------------------------------
  Method                  Endpoint                     Purpose
  ----------------------- ---------------------------- -----------------------
  GET                     `/health`                    Liveness check; no
                                                       secrets or user content

  POST                    `/sessions`                  Create a session and
                                                       expiry metadata

  DELETE                  `/sessions/current`          Delete current session
                                                       and temporary state

  POST                    `/documents`                 Upload and extract a
                                                       document

  GET                     `/documents/current`         Get extracted-text
                                                       preview and available
                                                       sections

  DELETE                  `/documents/current`         Remove current document
                                                       and related quiz state

  POST                    `/quizzes`                   Generate a quiz from a
                                                       selected source region

  GET                     `/quizzes/current`           Get current quiz
                                                       without exposing the
                                                       answer key in exam mode

  POST                    `/quizzes/current/answers`   Save/submit answer
                                                       selections as agreed

  POST                    `/quizzes/current/submit`    Submit quiz and receive
                                                       results

  DELETE                  `/quizzes/current`           Discard current quiz
  ----------------------------------------------------------------------------

The team may combine or split routes as long as the same behavior and
privacy properties remain.

## 3. Session creation

`POST /api/v1/sessions`

Response example:

``` json
{
  "sessionId": "opaque-random-id",
  "expiresAt": "2026-10-11T12:00:00.000Z"
}
```

The ID must be generated using a cryptographically secure random source.
Avoid logging it. If cookies are used, avoid returning the ID to
frontend JavaScript unnecessarily.

## 4. Document upload

`POST /api/v1/documents` --- `multipart/form-data`

Fields: - `file`: one PDF, DOCX, TXT, or PPTX file.

Validation: - Maximum 10 MB. - Allow-list file extensions and verify
actual file type/signature where practical. - Reject malformed files,
empty extracted text, unsupported files, and image-only/scanned PDFs
requiring OCR. - Do not trust the client-provided MIME type alone.

Illustrative response:

``` json
{
  "document": {
    "name": "lecture-notes.pdf",
    "characterCount": 12500,
    "sections": [
      {
        "id": "section-1",
        "title": "Introduction",
        "startPage": 1,
        "endPage": 3
      }
    ],
    "preview": "Extracted text preview..."
  }
}
```

The preview may be truncated for UI responsiveness; do not expose more
content than needed. Section page fields should be omitted when they
cannot be reliably determined.

## 5. Quiz generation

`POST /api/v1/quizzes`

Illustrative request:

``` json
{
  "source": {
    "type": "section",
    "sectionId": "section-1"
  },
  "questionCount": 10,
  "difficulty": "medium",
  "mode": "practice",
  "navigation": "one-by-one",
  "timerSeconds": null,
  "marksPerCorrect": 1,
  "negativeMarksPerIncorrect": 0
}
```

For the whole document, use a documented `source.type` value such as
`document`. For page-range fallback, agree on fields such as `startPage`
and `endPage`.

Validation: - `questionCount`: integer from 1 to 50. - `difficulty`:
`easy`, `medium`, or `hard`. - `mode`: `practice` or `exam`. -
`navigation`: `one-by-one` or `all-at-once`. - `timerSeconds`: null or a
positive, bounded integer. - Marks values: finite non-negative numbers;
set a documented maximum. - Source selection must belong to the active
session.

Response must include question IDs, question text, four options,
explanation, and reliable source reference when available. In exam mode,
never include the correct option or answer key in the client-visible
response before submission.

## 6. Submit and results

Illustrative request:

``` json
{
  "answers": [
    {
      "questionId": "q1",
      "selectedOptionId": "b"
    }
  ]
}
```

The server validates question IDs and option IDs against the active quiz
and computes score from the server-held answer key. Do not accept a
client-computed score as authoritative.

Illustrative result:

``` json
{
  "score": 8,
  "maximumScore": 10,
  "percentage": 80,
  "correctCount": 8,
  "incorrectCount": 2,
  "unansweredCount": 0,
  "results": [
    {
      "questionId": "q1",
      "isCorrect": true,
      "correctOptionId": "b",
      "explanation": "Explanation grounded in the selected source.",
      "sourcePage": 4
    }
  ]
}
```

Omit `sourcePage` when unavailable. The example is illustrative, not a
real quiz result.

## 7. Error codes to standardize

-   `INVALID_FILE`
-   `FILE_TOO_LARGE`
-   `UNSUPPORTED_FILE_TYPE`
-   `NO_EXTRACTABLE_TEXT`
-   `SESSION_EXPIRED`
-   `SESSION_NOT_FOUND`
-   `INVALID_SELECTION`
-   `INSUFFICIENT_SOURCE_CONTENT`
-   `MODEL_UNAVAILABLE`
-   `GENERATION_FAILED`
-   `INVALID_QUIZ_CONFIGURATION`
-   `QUIZ_NOT_FOUND`
-   `INVALID_ANSWER`
-   `INTERNAL_ERROR`

## 8. API contract checklist

-   [ ] Member 1 and Member 2 agree on exact field names and status
    codes.
-   [ ] Answer keys are never sent before exam submission.
-   [ ] Session handling is consistent across requests.
-   [ ] Error response schema is consistent.
-   [ ] Upload limits and validation are enforced server-side.
-   [ ] Contract examples are covered by integration tests.
