# Clearpoint

Clearpoint is a private supervisor feedback workspace for turning real conversations into clearer feedback, useful 1:1s, and manageable development goals.

## What you can do

- Create an account and sign in to a personal workspace.
- Analyze a feedback conversation for evidence, strengths, growth opportunities, and follow-up questions.
- Draft more specific and balanced feedback from notes.
- Prepare an agenda and questions for a one-to-one conversation.
- Create, update, and track growth plans with due dates and statuses.
- Start from reusable feedback frameworks, including Situation-Behavior-Impact and Start-Stop-Continue.
- Review saved reports, conversation signals, and recurring growth themes over time.
- Export a report briefing and switch between light and dark themes. Dark mode uses charcoal grey surfaces with green accents.

## Technology

- Frontend: React and Vite
- Backend: Spring Boot 4, Spring Security, and Spring Data JPA
- Local model: Ollama (`llama3.2` by default)
- Local persistent database: H2 file database at `backend/analyzer/data/`

## Run locally

Install Java 17+, Node.js/npm, and Ollama. In a terminal, download the model and start Ollama:

```powershell
ollama pull llama3.2
ollama serve
```

In another terminal, start the API:

```powershell
cd backend\analyzer
.\mvnw.cmd spring-boot:run
```

In a third terminal, start the web app:

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL (usually `http://localhost:5173`) and create an account. The frontend calls the API at `http://localhost:8080`, and the API calls Ollama at `http://localhost:11434`.

During local development, Vite proxies `/api` requests to `http://localhost:8080`, avoiding browser cross-origin issues. If the backend runs on another port, set `VITE_API_PROXY_TARGET` (for example, `http://localhost:8081`) before starting Vite, then restart the frontend. `VITE_API_URL` can be set to use a direct API URL instead of the development proxy. The Ollama URL and model can be overridden with `OLLAMA_URL` and `OLLAMA_MODEL`.

## Data and security notes

Passwords are stored as BCrypt hashes. The API uses server-side sessions and CSRF protection; reports and plans are isolated by account. Local database files are not tracked by Git.

This configuration is intended for local development and a single local instance, not internet-facing production use. Before deployment, configure a production database, HTTPS, secure cookie settings, backups, account recovery, and operational protections such as rate limiting.

Transcript analysis and AI drafting are sent to the locally configured backend and Ollama model. AI output can be incomplete or biased: verify its evidence and suggestions, and do not use generated scores as the sole basis for employment decisions. Reports and plans are stored in the local H2 database until deleted; deleting a browser session does not delete database records.

To erase all local accounts, reports, and plans, stop the backend and remove the database files in `backend/analyzer/data/`. This permanently deletes the local workspace data.
