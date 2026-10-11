# 10 --- Docker and Local Development

## 1. Goal

Provide a reproducible local demonstration using Docker Compose where
practical. The Ollama model runtime may run natively on Windows if GPU
passthrough or container GPU configuration is inconvenient.

## 2. Proposed services

-   `frontend`: React/Vite development server or built frontend.
-   `backend`: Express API.
-   `db`: PostgreSQL.
-   Optional `ollama`: local model runtime, depending on GPU support and
    team setup.

Use health checks and startup dependencies, but do not assume that a
container being started means its service is ready.

## 3. Environment configuration

Create `.env.example` with placeholders for: - `DATABASE_URL` - `PORT` -
`SESSION_TTL_MINUTES` - `CLEANUP_INTERVAL_MINUTES` - `TEMP_UPLOAD_DIR` -
`OLLAMA_BASE_URL` - `OLLAMA_MODEL` - frontend API base URL if required

Do not include real passwords or tokens. The actual `.env` must be
ignored by Git.

## 4. Local setup sequence

The exact commands depend on the package scripts and Compose files
created during implementation. Document and verify the final commands
after the repository is initialized. The intended sequence is:

1.  Install Git, Node.js LTS, Docker Desktop, and PostgreSQL tooling as
    needed.
2.  Install Ollama on Windows if running it natively.
3.  Pull the chosen Qwen3 model tag after benchmarking.
4.  Copy `.env.example` to `.env` and configure local values.
5.  Start PostgreSQL and backend dependencies.
6.  Start the backend and frontend.
7.  Open the local frontend URL and follow the smoke-test steps.
8.  Run tests and build commands.

Do not write unverified commands into the final README; replace this
checklist with tested commands once scripts exist.

## 5. Container and data rules

-   Do not mount the source tree's secrets or host home directory
    unnecessarily.
-   Do not put document content or quiz state into persistent volumes.
-   PostgreSQL persistence may retain only the approved session
    metadata; expired rows must be cleaned up.
-   Ensure temporary uploads are outside the Git repository and deleted.
-   Avoid copying `.env` into container images.
-   Use non-root container users where practical and small base images.

## 6. Windows and GPU notes

-   Benchmark Ollama on the actual target machine.
-   Native Ollama may be the simplest local path for NVIDIA GPU use.
-   If Ollama is containerized, verify GPU access explicitly rather than
    assuming it works.
-   Document whether the demo expects native Ollama or a Compose
    service.

## 7. Troubleshooting guide to complete

Record tested resolutions for: - PostgreSQL connection failure. - Ollama
service unavailable. - Model tag not found. - Model too slow or memory
constrained. - Port already in use. - File parser dependency/build
failure. - Session unexpectedly expired after backend restart.
