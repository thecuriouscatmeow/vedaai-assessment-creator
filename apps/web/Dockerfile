# =============================================================================
# VedaAI Web — Next.js standalone, multi-stage, pnpm monorepo
#
# Build context: monorepo root (.)
#
# ARG NEXT_PUBLIC_API_URL — public API base URL baked in at build time.
#   NEXT_PUBLIC_* vars are inlined by Next.js during next build; they cannot
#   be changed at runtime.  Pass the browser-accessible URL (e.g. the Railway
#   URL in production, http://localhost:4000 for local compose).
# =============================================================================

# ── Base: Node 20 + pnpm ──────────────────────────────────────────────────────
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@11.3.0 --activate

# ── Stage 1: install workspace deps ──────────────────────────────────────────
FROM base AS deps
WORKDIR /app

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json        ./apps/web/

RUN pnpm install --frozen-lockfile --filter @vedaai/web...

# ── Stage 2: build (next build) ───────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules          ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules

COPY tsconfig.base.json pnpm-workspace.yaml package.json ./
COPY packages/shared ./packages/shared
COPY apps/web        ./apps/web

# NEXT_PUBLIC_* vars must be present at build time — Next.js inlines them.
ARG  NEXT_PUBLIC_API_URL=http://localhost:4000
ENV  NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV  NEXT_TELEMETRY_DISABLED=1

# Runs apps/web/package.json "build" script (next build) from the monorepo root.
RUN pnpm --filter @vedaai/web build

# ── Stage 3: runner (standalone) ─────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# next build with output:'standalone' produces .next/standalone/.
# In a monorepo, Next mirrors the workspace layout inside standalone, so
# server.js lives at apps/web/server.js (relative to the standalone root).
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static     ./apps/web/.next/static
COPY --from=builder /app/apps/web/public           ./apps/web/public

EXPOSE 3000
ENV  PORT=3000
ENV  HOSTNAME=0.0.0.0

CMD ["node", "apps/web/server.js"]
