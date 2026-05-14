# Repository Guidelines

## Project Structure & Module Organization

This is a Node.js Express backend using ES modules (`"type": "module"`). The entry point is `server.js`; `test.js` provides an app/server setup used by tests. Route definitions live in `routes/`, grouped by role or feature such as `student.js`, `agency.js`, and `health.js`. Request handlers live in matching controller folders under `controllers/` (`controllers/student/`, `controllers/admin/`, etc.). Mongoose schemas are in `models/`, shared helpers in `utils/`, auth middleware in `middlewares/`, database/OpenAPI setup in `config/`, RAG/vector utilities in `rag/`, scripts in `scripts/`, and tests in `test/`.

## Build, Test, and Development Commands

- `npm install`: install dependencies from `package-lock.json`.
- `npm run dev`: start the API with `nodemon server.js` for local development.
- `npm start`: run the production-style server with Node.
- `npm test`: run all Mocha tests matching `test/**/*.test.js` with `NODE_ENV=test`.
- `npm run test:watch`: rerun the Mocha test suite on file changes.
- `node scripts/seedSuperAdmin.js`: run the seed script when admin bootstrap data is needed.

## Coding Style & Naming Conventions

Use ES module imports/exports and keep file names descriptive by role and feature, for example `controllers/student/student.auth.js` or `models/pendingSignup.js`. Follow the existing two-space indentation style in new test files and keep controller code organized as small exported async handlers. Use `camelCase` for variables and functions, `PascalCase` for Mongoose models, and uppercase constants for fixed configuration values such as OTP limits. No formatter or linter script is currently defined, so keep changes consistent with nearby code.

## Testing Guidelines

Tests use Mocha, Chai, Supertest, and `mongodb-memory-server`. Place tests in `test/` with the pattern `*.test.js`, and use `test/setup.db.js` helpers when a test needs an isolated MongoDB instance. Prefer API-level tests through Supertest for route behavior, including success, validation, and authorization cases. Run `npm test` before opening a PR.

## Commit & Pull Request Guidelines

Recent commits use short imperative summaries such as `Fixed student list` and `Added more credential`. Keep commits focused and write a clear one-line subject describing the behavior changed. Pull requests should include a concise description, test results, linked issue or task when applicable, and API examples or screenshots only when they clarify the change.

## Security & Configuration Tips

Keep `.env` local and never commit secrets, credentials, API keys, or connection strings. Use environment variables for MongoDB, email, Azure Blob, OpenAI/OpenRouter, Pinecone, JWT, and deployment settings. The deployment workflow targets the `Master` branch and uses GitHub Actions secrets for VPS access.
