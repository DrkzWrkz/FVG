# Autonomous Record Label Platform

Foundational monorepo scaffold for an AI-powered autonomous music management SaaS platform. This repository starts with the shared workspace layout, PostgreSQL schema foundation, a FastAPI orchestration service, and a Next.js App Router frontend shell.

## Workspace tree

```text
.
|-- apps/
|   `-- web/
|       |-- app/
|       |   |-- api/health/route.ts
|       |   |-- globals.css
|       |   |-- layout.tsx
|       |   `-- page.tsx
|       |-- components/
|       |   `-- ui/
|       |       |-- button.tsx
|       |       `-- card.tsx
|       |-- lib/
|       |   `-- utils.ts
|       |-- components.json
|       |-- next.config.mjs
|       |-- package.json
|       |-- postcss.config.mjs
|       |-- tsconfig.json
|       `-- next-env.d.ts
|-- services/
|   `-- orchestrator/
|       |-- app/
|       |   |-- agents/
|       |   |   |-- __init__.py
|       |   |   |-- ar_discovery.py
|       |   |   |-- legal_royalty.py
|       |   |   |-- marketing_pr.py
|       |   |   `-- virtual_manager.py
|       |   |-- config.py
|       |   |-- database.py
|       |   |-- main.py
|       |   |-- models.py
|       |   `-- schemas.py
|       |-- migrations/
|       |   `-- 0001_foundation.sql
|       `-- requirements.txt
|-- .env.example
|-- .gitignore
|-- compose.yml
|-- Dockerfile
|-- package.json
`-- requirements.txt
```

## Initial scope

This scaffold includes:

- Next.js 14+ style App Router frontend foundation with Tailwind CSS, shadcn-style primitives, and Lucide icons.
- FastAPI orchestration service with typed request and response schemas.
- Initial PostgreSQL migration for:
  - `artists`
  - `tracks`
  - `contracts`
  - `agent_states`
- Org-chart metadata for the first autonomous label agents:
  - A&R Discovery Agent
  - Autonomous Virtual Manager Agent
  - Marketing & PR Crew
  - Legal & Royalty Administration Agent

## API foundation

The FastAPI service exposes the first foundational entry points:

- `GET /healthz`
- `GET /api/v1/agents/org-chart`
- `GET /api/v1/foundation/database`
- `GET /api/v1/artists`
- `POST /api/v1/artists/intake-preview`
- `GET /api/v1/tracks`
- `POST /api/v1/tracks/intake-preview`
- `GET /api/v1/contracts`
- `POST /api/v1/contracts/intake-preview`
- `GET /api/v1/agent-states`
- `POST /api/v1/agent-states/intake-preview`

## Quick start

```bash
npm install
python -m pip install -r requirements.txt
cp .env.example .env
```

Run the services locally:

```bash
npm run dev:web
npm run dev:api
```

Apply the initial PostgreSQL migration when a database is available:

```bash
npm run db:migrate
```

## Incremental implementation path

1. Foundation: workspace, schema, typed API entry points.
2. A&R discovery service and synthetic telemetry ingestion.
3. Virtual manager release strategy workflows.
4. Marketing and PR multi-agent linear crew.
5. Legal and royalty LangGraph workflows with human-in-the-loop checkpoints.
