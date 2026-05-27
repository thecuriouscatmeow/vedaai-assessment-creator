# =============================================================================
# VedaAI API + Worker — multi-stage, pnpm monorepo
#
# Build context: monorepo root (.)
#
# ARG ENTRY — entry point filename stem (without .ts):
#   server  (default) → src/server.ts   — Express + Socket.IO API
#   worker             → src/worker.ts   — BullMQ generation worker
#
# Example:
#   docker build --build-arg ENTRY=worker -f apps/api/Dockerfile .
# =============================================================================

# ── Base: Node 20 + pnpm ──────────────────────────────────────────────────────
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@11.3.0 --activate

# ── Stage 1: install workspace deps ──────────────────────────────────────────
FROM base AS deps
WORKDIR /app

# Manifests only first — Docker caches this layer until any package.json changes.
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json        ./apps/api/

# Install api + its workspace deps (includes devDeps — tsx is a devDep).
# The ...  suffix means "@vedaai/api and all of its local workspace deps".
RUN pnpm install --frozen-lockfile --filter @vedaai/api...

# ── Stage 2: runner ───────────────────────────────────────────────────────────
FROM base AS runner

# Run as non-root for container security best practice.
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

WORKDIR /app

# Copy the pnpm virtual store (node_modules/.pnpm/) and package-level .bin
# symlinks.  Docker multi-stage COPY preserves symlinks; the relative symlink
# chain api/node_modules/.bin/tsx → ../../node_modules/.pnpm/... resolves
# correctly because the virtual store is also copied.
COPY --from=deps /app/node_modules          ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules

# Workspace manifest + base TS config (tsx needs neither to run, but pnpm
# workspace resolution uses the manifests if pnpm exec is called).
COPY tsconfig.base.json pnpm-workspace.yaml package.json ./

# Source — shared (TypeScript; resolved by tsx on the fly) + api
COPY packages/shared ./packages/shared
COPY apps/api        ./apps/api

# Configurable entry point (ARG → ENV so sh -c expands it at runtime).
ARG  ENTRY=server
ENV  VEDA_ENTRY=${ENTRY}

USER nodejs

EXPOSE 4000

# tsx runs TypeScript directly — no compilation step required.
# @vedaai/shared TS source in packages/shared/ is reachable via the workspace
# symlink in node_modules/@vedaai/shared → packages/shared.
CMD ["sh", "-c", "exec node apps/api/node_modules/.bin/tsx apps/api/src/${VEDA_ENTRY}.ts"]
