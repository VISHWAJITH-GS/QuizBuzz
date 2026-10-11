# 11 --- CI/CD Pipeline

## 1. Purpose

Use GitHub Actions to catch errors before merging and make the project
reproducible. The first pipeline should validate code, not require
deployment to a paid cloud.

## 2. Pull request workflow

On pull requests and pushes to the main branch: 1. Check out the
repository. 2. Set up the agreed Node.js LTS version. 3. Install
dependencies from lockfiles. 4. Run formatting/lint checks. 5. Run
TypeScript type checks. 6. Run unit and integration tests. 7. Build
frontend and backend. 8. Optionally validate Dockerfiles/Compose
configuration. 9. Publish clear pass/fail status.

Use separate jobs for frontend and backend if that improves clarity. Do
not require a GPU or real Ollama model for normal CI; mock the Ollama
client.

## 3. Branch strategy

-   `main`: stable, demo-ready code.
-   `feature/<short-name>`: individual tasks.
-   Open pull requests to merge features into `main`.
-   Require review by the other team member where practical.
-   Avoid committing generated build output, local uploads, secrets, or
    model files.

## 4. Optional image workflow

Only add Docker image publishing when the team has a concrete need. If
enabled: - Build after tests pass. - Use repository/organization secrets
for credentials. - Pin action versions and review permissions. - Prefer
least-privilege workflow permissions. - Do not publish `.env` or private
study documents in images.

## 5. Suggested quality gates

-   Lint passes.
-   Type checks pass.
-   Tests pass.
-   Build passes.
-   No known secret is committed.
-   API contract examples and tests remain aligned.

## 6. Implementation checklist

-   [ ] Add frontend workflow.
-   [ ] Add backend workflow.
-   [ ] Add test scripts and lockfiles.
-   [ ] Configure pull-request triggers.
-   [ ] Verify CI with a deliberately failing test, then revert it.
-   [ ] Document badges/status in README if desired.
