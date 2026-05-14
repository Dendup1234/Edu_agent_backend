# Edu Agent Backend

Node.js/Express backend for the Edu Agent platform. The API supports student, agency, admin, agent, mentor, OAuth, chatbot, document, event, scholarship, university, course, and workflow-automation features.

## API Documentation

Swagger/OpenAPI documentation is available at:

- Swagger UI route: `http://localhost:8000/api-docs`
- [`docs/openapi.yaml`](docs/openapi.yaml)

After installing and mounting `swagger-ui-express`, start the server and open:

```text
http://localhost:8000/api-docs
```

To view the raw spec in an external Swagger tool:

1. Open <https://editor.swagger.io/>.
2. Import or paste `docs/openapi.yaml`.
3. Set the server URL to your running backend, usually `http://localhost:8000`.

The spec documents every route mounted in `server.js`, including:

- `GET /health`
- OAuth routes: `/google-signin-agency`, `/google-signin-student`
- Chat route: `/api/v1/openai/chatbot`
- Student routes under `/api/v1/students`
- Agency routes under `/api/v1/agency`
- Admin routes under `/api/v1/admin`
- Agent routes under `/api/v1/agent`
- Mentor routes under `/api/v1/mentor`
- Internal automation routes using `x-internal-token`

Most protected routes use a JWT bearer token:

```http
Authorization: Bearer <token>
```

Internal workflow routes use:

```http
x-internal-token: <INTERNAL_AUTOMATION_TOKEN>
```

## Project Structure

```text
server.js              Express app entry point
routes/                Route definitions grouped by domain and role
controllers/           Request handlers grouped by role and feature
models/                Mongoose models
middlewares/           Auth and permission middleware
utils/                 Shared helpers for JWT, email, passwords, notifications
config/                Database and external client configuration
rag/                   RAG, embedding, vector, and Pinecone utilities
scripts/               Operational scripts such as admin seeding
test/                  Mocha/Chai/Supertest tests
docs/openapi.yaml      Swagger/OpenAPI API reference
```

## Setup

Install dependencies:

```bash
npm install
```

Create a local `.env` file with the required settings for MongoDB, JWT, email, Azure Blob Storage, DeepSeek/OpenAI-compatible chat, Pinecone, and automation webhooks. Do not commit `.env`.

Common environment variables used by the code include:

```text
PORT
MONGO_URI
JWT_SECRET
INTERNAL_AUTOMATION_TOKEN
EMAIL_USER
EMAIL_PASS
APP_URL
AZURE_STORAGE_ACCOUNT_NAME
AZURE_STORAGE_ACCOUNT_KEY
AZURE_CONTAINER_NAME
DEEPSEEK_API_KEY
DEEPSEEK_BASE_URL
PINECONE_API_KEY
PINECONE_INDEX
N8N_AUTO_ASSIGNMENT_WEBHOOK_URL
N8N_FRAUD_DETECTION_WEBHOOK_URL
N8N_WEBHOOK_SECRET
```

## Development Commands

```bash
npm run dev
```

Starts the API with `nodemon server.js`.

```bash
npm start
```

Starts the API with `node server.js`.

```bash
npm test
```

Runs Mocha tests under `test/**/*.test.js` with `NODE_ENV=test`.

```bash
npm run test:watch
```

Runs tests in watch mode.

## Testing

Tests use Mocha, Chai, Supertest, and `mongodb-memory-server`. Add test files under `test/` with the `*.test.js` suffix. Use `test/setup.db.js` when a test needs an isolated in-memory MongoDB instance.

## Deployment

The GitHub Actions workflow in `.github/workflows/deploy.yml` deploys pushes to the `Master` branch to the configured VPS. Deployment uses repository secrets for SSH access and reloads the PM2 process named `edu-agent-backend`.
