<p align="center">
  <img src="docs/logo.svg" alt="Assistant Logo" width="240"/>
</p>

<p align="center">
  <a href="https://github.com/annurdien/assistant/actions/workflows/docker-publish.yml">
    <img src="https://github.com/annurdien/assistant/actions/workflows/docker-publish.yml/badge.svg" alt="Docker Publish"/>
  </a>
  <a href="https://github.com/annurdien/assistant/actions/workflows/playwright.yml">
    <img src="https://github.com/annurdien/assistant/actions/workflows/playwright.yml/badge.svg" alt="Playwright Tests"/>
  </a>
  <a href="https://ghcr.io/annurdien/assistant">
    <img src="https://img.shields.io/badge/ghcr.io-annurdien%2Fassistant-7c3aed?logo=github" alt="GHCR Image"/>
  </a>
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"/>
</p>

<p align="center">
  A self-hosted AI-powered WhatsApp assistant with a full management dashboard, cron jobs, knowledge base, and expense tracking — deployed as a single Docker image.
</p>

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Running with Docker](#running-with-docker)
- [Development](#development)
- [Testing](#testing)
- [Contributing](#contributing)

---

## Overview

Assistant is a monorepo that bundles three services into one container:

| Service | Port | Description |
|---|---|---|
| API Server | 3000 | REST API, authentication, WebSocket proxy |
| WhatsApp Service | 3001 | Baileys-based WA bridge (internal only) |
| Dashboard | 5173 | React admin UI |

Key capabilities:

- Natural language command execution powered by Google Gemini
- Custom slash-command creation with a Monaco code editor
- Scheduled cron jobs (automation)
- Knowledge base with vector search via pgvector
- Expense tracking
- Access whitelist per WhatsApp JID
- Rate limiting, secret management, and audit logs

---

## Tech Stack

### Backend

| Technology | Purpose |
|---|---|
| [Fastify](https://fastify.dev) | HTTP API framework |
| [Prisma](https://prisma.io) | ORM + schema migrations |
| [PostgreSQL 15 + pgvector](https://github.com/pgvector/pgvector) | Relational store + vector embeddings |
| [Baileys](https://github.com/WhiskeySockets/Baileys) | WhatsApp Web multi-device protocol |
| [Google Gemini](https://ai.google.dev) | Large language model for AI responses |
| [Node.js 22](https://nodejs.org) | Runtime |

### Frontend

| Technology | Purpose |
|---|---|
| [React 18](https://react.dev) | UI library |
| [Vite](https://vitejs.dev) | Build tool and dev server |
| [shadcn/ui](https://ui.shadcn.com) | Component library (Radix + Tailwind) |
| [Recharts](https://recharts.org) | Analytics charts |
| [Monaco Editor](https://microsoft.github.io/monaco-editor) | In-browser code editor for commands |
| [TanStack Query](https://tanstack.com/query) | Server state management |

### Infrastructure

| Technology | Purpose |
|---|---|
| [Docker](https://docker.com) | Containerization (multi-stage build) |
| [GitHub Actions](https://github.com/features/actions) | CI/CD, GHCR publish |
| [pnpm workspaces](https://pnpm.io/workspaces) | Monorepo dependency management |
| [Playwright](https://playwright.dev) | End-to-end browser testing |

---

## Architecture

```
                        +-------------------+
                        |   Docker Image    |
                        | ghcr.io/annurdien |
                        |   /assistant      |
                        +-------------------+
                               |
         +---------------------+---------------------+
         |                     |                     |
   +----------+         +-----------+         +-----------+
   |  API     |  :3000  | WhatsApp  |  :3001  | Dashboard |  :5173
   |  Server  |<------->|  Service  |         |   (Vite)  |
   +----------+         +-----------+         +-----------+
         |
   +----------+
   | Postgres |
   | pgvector |
   +----------+
```

The WhatsApp service port (3001) is never exposed to the host. All external traffic enters through the API server.

---

## Getting Started

### Prerequisites

- Docker and Docker Compose v2
- A Google Gemini API key ([get one here](https://aistudio.google.com/app/apikey))
- A WhatsApp account to link

### Quick Start (GHCR image)

```bash
# 1. Create environment file
cp .env.example .env
# Fill in required values — see Configuration section

# 2. Pull and start
docker compose pull
docker compose up -d

# 3. Scan the QR code (first run only)
docker compose logs -f app

# 4. Open the dashboard
open http://localhost:5173
```

---

## Configuration

Copy `.env.example` to `.env` and fill in the required values:

| Variable | Required | Default | Description |
|---|---|---|---|
| `POSTGRES_PASSWORD` | Yes | — | PostgreSQL password |
| `DATABASE_URL` | Yes | — | Full Postgres connection string |
| `JWT_SECRET` | Yes | — | Secret key for session tokens |
| `ADMIN_PASSWORD` | Yes | — | Dashboard admin password |
| `GEMINI_API_KEY` | Yes | — | Google Gemini API key |
| `INTERNAL_API_TOKEN` | Yes | — | Shared secret between API and WA service |
| `GEMINI_MODEL` | No | `gemini-1.5-flash` | Gemini model name |
| `MAX_DAILY_COMMANDS` | No | `50` | Per-user daily command limit |
| `CORS_ORIGIN` | No | `http://localhost:5173` | Allowed origin for CORS |

---

## Running with Docker

### Using the GHCR image (recommended)

```bash
# Latest build from main
docker compose pull && docker compose up -d

# Pin a specific release
IMAGE_TAG=v1.2.3 docker compose pull && IMAGE_TAG=v1.2.3 docker compose up -d
```

### Building locally

```bash
# Comment the `image:` line and uncomment the `build:` block in docker-compose.yml
docker compose up --build -d
```

### Useful commands

```bash
docker compose logs -f app          # stream logs
docker compose exec app sh          # open a shell inside the container
docker compose down                 # stop services (keep volumes)
docker compose down -v              # stop and wipe all data
```

---

## Development

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm --filter @assistant/database run db:generate

# Start all services in development mode
pnpm dev
```

Individual services:

```bash
pnpm start:api      # API server with hot reload
pnpm start:wa       # WhatsApp service
pnpm start:dash     # Dashboard (Vite dev server)
```

---

## Testing

### API Integration Tests

Tests all API endpoints end-to-end against a running server:

```bash
pnpm test:e2e
```

### Playwright Browser Tests

79 browser integration tests across auth, commands, settings, navigation, and dashboard pages:

```bash
pnpm test:ui            # headless
pnpm test:ui:headed     # watch the browser
pnpm test:ui:report     # open HTML report
```

> Run `pnpm test:ui` before `pnpm test:e2e` on a fresh server to avoid the auth rate-limit window being consumed by the wrong-password attempts in the browser tests.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit your changes: `git commit -m "feat: add my feature"`
4. Push and open a pull request

Please ensure all Playwright tests pass before submitting.

---

## License

MIT License. See [LICENSE](LICENSE) for details.
