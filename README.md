# VedaAI — AI Assessment Creator

Teachers describe an assignment; an LLM generates a structured question paper
(sections, questions, difficulty, marks); the teacher reviews it in an
exam-paper layout and downloads a PDF.

> Foundations phase. Feature work (form → generation pipeline → paper render →
> PDF) lands in later phases. See the deployed link and full usage guide once
> Phase 2 ships.

## Stack

| Layer    | Tech |
|----------|------|
| Frontend | Next.js (App Router) · TypeScript · Redux Toolkit · Tailwind v4 · Socket.IO client |
| Backend  | Express · TypeScript · MongoDB · Redis · BullMQ · Socket.IO |
| AI       | Provider-agnostic adapter (Gemini default) |
| Shared   | Zod contract (`@vedaai/shared`) — single source of truth for types |

## Monorepo layout

```
apps/web        Next.js frontend
apps/api        Express API + worker
packages/shared Zod schemas + inferred types (imported by both apps)
```

## Local development

Requires Node ≥ 20 and pnpm (via `corepack enable pnpm`).

```bash
pnpm install
cp .env.example .env   # fill in values

pnpm -r typecheck      # typecheck every workspace
pnpm -r test           # run unit tests
pnpm lint              # ESLint (enforces no-console)

pnpm --filter @vedaai/api dev    # start the API
pnpm --filter @vedaai/web dev    # start the web app
```

### Code-quality hooks (run once per clone)

This repo uses [CodeRabbit CLI](https://docs.coderabbit.ai/cli) as a `post-commit`
hook. After every `git commit`, it reviews the diff and prints findings to the
terminal.

```bash
# 1. Install CodeRabbit CLI (once per machine)
npm install -g @coderabbit/coderabbit-cli
# or: brew install coderabbit

# 2. Install git hooks (once per clone)
bash scripts/install-hooks.sh
```

> The hook is advisory — it never blocks a commit. If CodeRabbit is not installed,
> a warning is printed and the hook skips silently.

## Engineering standards

Layered architecture (route → service → domain → Zod contract → adapter),
provider-agnostic adapters, centralized Zod types, structured pino logging,
test-driven development. See deployment and contributor notes as the project
progresses.
