# FRIENDS

FRIENDS is an AI app and project builder that turns a rough idea into a structured, runnable project package. It enhances prompts, chooses a project template, plans the build, generates code, validates output, repairs issues, and prepares the result for ZIP export.

The project includes a Next.js frontend, an Express/TypeScript backend, Supabase-backed authentication and data storage, and a mock/demo path so the builder can be explored without configuring external services first.

## Features

- Landing page with launch, sign-in, and sign-up flows
- Demo mode for using the dashboard without Supabase credentials
- Dashboard workspace for generating new project ideas
- Prompt enhancement and template selection workflow
- Multi-stage generation timeline
- Generated project preview and validation report
- ZIP export path for generated source files
- Supabase authentication support
- Backend services for agents, projects, compilation, package export, and model routing
- AI provider support for mock, Gemini, OpenAI, Anthropic, and Ollama paths

## Tech Stack

### Frontend

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Framer Motion
- Lucide icons
- Supabase browser auth
- Vitest

### Backend

- Express
- TypeScript
- Supabase admin client
- JSZip
- Zod
- OpenAI, Gemini, Anthropic, Ollama provider adapters

## Project Structure

```text
.
├── frontend/              # Next.js app
│   ├── app/               # Routes, dashboard pages, and API routes
│   ├── components/        # UI, auth, builder, and layout components
│   ├── lib/               # Auth, API, generation, export, and template helpers
│   └── tests/             # Frontend helper tests
├── backend/               # Express API
│   ├── src/controllers/   # Route controllers
│   ├── src/routes/        # API routes
│   ├── src/services/      # AI, generation, export, package, and compiler services
│   └── src/lib/           # Provider and generation utilities
├── supabase/migrations/   # Database schema migrations
└── render.yaml            # Render deployment config
```

## Local Setup

Install frontend dependencies:

```bash
cd frontend
npm install
```

Install backend dependencies:

```bash
cd backend
npm install
```

Run the frontend:

```bash
cd frontend
npm run dev
```

Run the backend in another terminal:

```bash
cd backend
npm run dev
```

Open the app at:

```text
http://localhost:3000
```

The backend defaults to:

```text
http://localhost:5000
```

## Environment Variables

### Frontend

Create `frontend/.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Supabase is optional for demo mode. If the frontend Supabase variables are missing, normal email/password auth is disabled, but the demo flow still works.

### Backend

Create `backend/.env`:

```bash
PORT=5000
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
OPENAI_API_KEY=optional_openai_key
GEMINI_API_KEY=optional_gemini_key
ANTHROPIC_API_KEY=optional_anthropic_key
OLLAMA_BASE_URL=http://localhost:11434
```

Model-specific variables are optional. When provider credentials are not configured, FRIENDS can still use its mock generation paths.

## Demo Mode

Use **Continue as Demo** from the sign-in or sign-up page to enter the dashboard without creating an account. Demo mode stores a local browser flag and uses the mock builder workflow.

To leave demo mode, click **Sign Out** in the dashboard.

## Validation

Run frontend checks:

```bash
cd frontend
npm run lint
npm run test
npm run build
```

Run backend checks:

```bash
cd backend
npm run build
```

## Main User Flow

1. Open the landing page.
2. Choose **Launch Builder**, **Sign In**, or **Continue as Demo**.
3. Enter the dashboard.
4. Describe the project idea.
5. Let FRIENDS enhance the prompt.
6. Review and approve the enhanced prompt.
7. Watch the generation pipeline run.
8. Inspect the generated project preview and validation report.
9. Download the project ZIP when export is ready.

## Notes

- Supabase migrations live in `supabase/migrations`.
- The frontend also includes a PDF notes API route and helper tests from an earlier app workflow.
- Generated projects are represented as isolated file maps before export. They do not overwrite the FRIENDS app source.
- The local app is designed to remain usable without paid AI credentials through mock generation.

## Roadmap

- Persistent project history
- Richer generated project previews
- More project templates
- Deeper validation and auto-repair
- Better provider configuration UI
- OCR and document-driven generation workflows
- Deployment export presets
