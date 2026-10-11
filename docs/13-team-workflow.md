# 13 --- Team Workflow

## 1. Roles

### Member 1 --- Frontend

Primary ownership: - React + TypeScript + Vite application structure. -
Upload UI, extraction preview, and section selection. - Quiz
configuration, navigation modes, timer, and results UI. - API
integration and frontend tests. - Coordinate with Member 2 on
request/response contracts.

### Member 2 --- Backend, GenAI, and DevOps

Primary ownership: - Node.js + Express + TypeScript API. - Document
extraction and section metadata. - Session lifecycle, PostgreSQL
metadata, expiry, and cleanup. - Ollama/Qwen3 benchmark, prompting,
response validation, and retry policy. - Server-side answer key,
scoring, and backend tests. - Docker Compose integration, GitHub Actions
CI, safe logging, health checks, and operations docs.

### Shared responsibilities

-   Requirements and API contract.
-   Agreeing error formats and field names.
-   Integration tests and end-to-end demo.
-   Code review, documentation, and presentation.

## 2. Recommended build order

1.  Confirm requirements and repository conventions.
2.  Create requirements, architecture, and team workflow docs.
3.  Agree on the API contract before implementing routes.
4.  Initialize backend project and health endpoint.
5.  Build the frontend shell and agree on API integration.
6.  Implement session metadata and lifecycle.
7.  Implement document extraction and preview.
8.  Benchmark Ollama/Qwen3.
9.  Implement generation and validation.
10. Implement quiz submission and scoring.
11. Integrate frontend and backend.
12. Add tests, Compose, and CI.
13. Run a clean-machine demo rehearsal and update docs.

## 3. Work in small phases

-   Start with the current phase; do not build every subsystem at once.
-   Break tasks into small issues with acceptance criteria.
-   Use feature branches and pull requests.
-   Keep `main` buildable and demo-ready.
-   Do not merge a new endpoint until its contract and error behavior
    are clear.
-   Use mock model responses in most tests; reserve live model checks
    for manual/local testing.

## 4. Definition of done

A task is complete when: - Its acceptance criteria are met. - Validation
and failure cases are handled. - Relevant tests pass. - No sensitive
content or secrets are logged/committed. - Documentation and API
examples are updated. - The other member can run or review the change.

## 5. Git hygiene

Suggested `.gitignore` entries include: - `.env` - `node_modules/` -
`dist/` - coverage output - temporary uploads - logs - model artifacts -
local database dumps - editor/OS files

Never commit actual uploaded study material, extracted text, generated
quiz payloads, session IDs, answer keys, or credentials.

## 6. Team handoff

Member 2 should provide Member 1 with: - API endpoint list and
schemas. - Error code list. - Session creation/deletion behavior. - Quiz
response schema that hides answer keys in exam mode. - Local backend
startup instructions. - Example requests using synthetic sample
documents.

Member 1 should provide Member 2 with: - Required UI states and API
interactions. - Loading, error, empty, and expired-session states. -
Expected navigation/timer behavior. - Agreed frontend environment
variable names.
