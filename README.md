# QuizBuzz AI

QuizBuzz AI turns study documents into document-grounded multiple-choice quizzes so college students can check their understanding.

---

## Documentation Index

1. [Requirements](docs/01-requirements.md)
2. [System Architecture](docs/02-system-architecture.md)
3. [API Contract](docs/03-api-contract.md)
4. [Database and Session Design](docs/04-database-and-session-design.md)
5. [Document Processing](docs/05-document-processing.md)
6. [AI Quiz Generation](docs/06-ai-quiz-generation.md)
7. [Scoring and Quiz Rules](docs/07-scoring-and-quiz-rules.md)
8. [Security and Privacy](docs/08-security-and-privacy.md)
9. [Testing Strategy](docs/09-testing-strategy.md)
10. [Docker and Local Development](docs/10-docker-and-local-development.md)
11. [CI/CD Pipeline](docs/11-ci-cd-pipeline.md)
12. [Deployment and Operations](docs/12-deployment-and-operations.md)
13. [Team Workflow](docs/13-team-workflow.md)

---

## Implemented Architecture

- **Frontend**: React 18, TypeScript, Vite, custom design system (`index.css`) with dark-mode aesthetic, step transitions, practice & exam modes, countdown timer, and `sessionStorage` same-tab recovery.
- **Backend API**: Node.js, Express, TypeScript, Zod environment validation.
- **Document Parsers**: Multi-format engine supporting **PDF** (`pdf-parse`), **DOCX** (`mammoth`), **TXT**, and **PPTX** (`officeparser`) up to 10 MB, with section and heading detection.
- **AI Engine**: Ollama client supporting Qwen3/Qwen2.5 with prompt injection defense, structural JSON enforcement, 4-attempt retry pipeline, and document-grounded fallback generator for offline testing.
- **Data Minimization**: PostgreSQL stores **only** ephemeral session metadata (`session_id`, `created_at`, `expires_at`). Uploaded files, extracted text, questions, answer keys, and scores are never permanently stored.
- **Server-Side Scoring**: Authoritative grading on backend with secret answer keys during exam mode and configurable negative marking.

---

## Quick Start (Local Development)

### 1. Prerequisites
- **Node.js**: v20 or v22+ LTS (`node -v`)
- **Docker Desktop** (optional, for PostgreSQL service): `docker compose up -d`
- **Ollama** (optional for live GPU model): [ollama.ai](https://ollama.com/) with `ollama pull qwen3:1.7b `

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
```bash
cp .env.example .env
```
*(Default settings connect to local PostgreSQL if available, or seamlessly fallback to an in-memory session metadata store for quick offline demo)*

### 4. Start Development Servers
Open two terminal tabs:

**Terminal 1 — Backend API** (running on `http://localhost:3000`):
```bash
npm run dev:backend
```

**Terminal 2 — Frontend Application** (running on `http://localhost:5173`):
```bash
npm run dev:frontend
```

Open `http://localhost:5173` in your browser.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev:backend` | Starts the Express API server with live reloading via `tsx` |
| `npm run dev:frontend` | Starts the Vite frontend dev server with hot reload |
| `npm run test` | Runs all Vitest unit and Supertest integration tests |
| `npm run lint` | Runs TypeScript type checking across `shared`, `backend`, and `frontend` |
| `npm run build` | Compiles production bundles for all packages |

---

## Testing & Quality Assurance

Run the test suite:
```bash
npm run test
```
The test suite covers:
- Scoring formulas (correct, incorrect, unanswered, negative marking, percentage clamping).
- AI question validation (schema conformity, duplicate rejection, and grounding verification).
- Full end-to-end API lifecycle (session $\rightarrow$ upload $\rightarrow$ preview $\rightarrow$ exam generation $\rightarrow$ answer key secrecy $\rightarrow$ submission $\rightarrow$ cleanup).
- Privacy verification (zero content stored in persistent database or error logs).

---

## Docker Compose

To start PostgreSQL in Docker:
```bash
docker compose up -d
```
To stop the database:
```bash
docker compose down
```

---

## Privacy & Security Guarantees
- No user accounts or passwords.
- No documents, extracted text, or quizzes stored in PostgreSQL.
- In exam mode, correct options and explanations are withheld until submission.
- Expired sessions and temporary files are automatically cleaned up every 5 minutes.
