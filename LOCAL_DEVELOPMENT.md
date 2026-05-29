# Local Development Setup

## Quick Start

Run the interactive startup script:

```bash
./dev-start.sh
```

The script will ask you to choose between two modes:

### Mode 1: Dev Mode (Recommended) 🚀
- **Docker Services**: Redis only
- **Local Services**: API and Web run locally with hot-reload
- **Best for**: Fast development with instant feedback
- **Ports**: API (4000), Web (3000), Redis (6379)

### Mode 2: Full Docker (Production-like)
- **All Services**: Redis, MongoDB, API, Worker, Web in containers
- **Best for**: Testing the full stack, debugging container issues
- **Ports**: Same as above
- **Slower**: Requires rebuilding containers on changes

---

## Manual Setup (if you prefer)

### Option 1: Dev Mode

**Terminal 1 — Start Redis:**
```bash
docker compose -f docker-compose.dev.yml up
```

**Terminal 2 — Start API:**
```bash
pnpm --filter @vedaai/api dev
```

**Terminal 3 — Start Web:**
```bash
pnpm --filter @vedaai/web dev
```

Then visit:
- **Web**: http://localhost:3000
- **API**: http://localhost:4000

**To stop:** Run `docker compose -f docker-compose.dev.yml down`

---

### Option 2: Full Docker Stack

**Start all services:**
```bash
docker compose up --build
```

**View logs:**
```bash
docker compose logs -f              # all services
docker compose logs -f api          # API only
docker compose logs -f worker       # Worker only
docker compose logs -f web          # Web only
```

**Stop services:**
```bash
docker compose down                 # stop containers
docker compose down -v              # stop and remove volumes (clean slate)
```

Then visit:
- **Web**: http://localhost:3000
- **API**: http://localhost:4000

---

## Environment Variables

For full Docker mode, create a `.env` file in the project root:

```bash
# Real credentials (replace with yours)
GEMINI_API_KEY=your_key_here
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Or use stubs for development (docker-compose.yml has fallbacks)
```

For dev mode (local API), environment variables should be set in your shell or `.env.local` in apps/api/.

---

## Useful Commands

### View active services:
```bash
docker compose ps
```

### Remove everything and start fresh:
```bash
docker compose down -v && docker compose up --build
```

### Access MongoDB directly:
```bash
docker exec -it vedaai-mongo mongosh vedaai
```

### Access Redis CLI:
```bash
docker exec -it vedaai-redis redis-cli
```

### Rebuild without cache:
```bash
docker compose up --build --force-recreate
```

---

## Troubleshooting

### Port already in use
If port 3000, 4000, or 6379 is already in use:

**Dev Mode:** Modify `docker-compose.dev.yml` or change the port in the pnpm dev commands.

**Full Docker:** Modify the port mappings in `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # map to different port
```

### MongoDB connection failed
```bash
# Reset MongoDB volume
docker compose down -v
docker compose up
```

### Services not healthy
```bash
# View full logs
docker compose logs

# Restart a specific service
docker compose restart api
```

### Out of disk space
```bash
# Clean up Docker
docker system prune -a
```

---

## Development Workflow

### Dev Mode (Recommended)

1. Run `./dev-start.sh` and select mode 1
2. API server auto-reloads on file changes (tsx watch)
3. Web auto-reloads on file changes (Next.js dev server)
4. Check console/terminal for logs

### Full Docker Mode

1. Run `./dev-start.sh` and select mode 2
2. Make changes to code
3. Rebuild: `docker compose up --build`
4. View logs: `docker compose logs -f`

---

## Health Checks

The docker-compose.yml includes health checks for:
- **Redis**: Checks with `redis-cli ping`
- **MongoDB**: Checks with `mongosh db.runCommand({ ping: 1 })`
- **API**: Depends on Redis and MongoDB being healthy
- **Worker**: Depends on Redis and MongoDB being healthy
- **Web**: Depends on API being ready

View health status:
```bash
docker compose ps
```

---

## Next Steps

Once services are running:

1. Open http://localhost:3000 in your browser
2. Start developing!
3. Check the API docs at http://localhost:4000/docs (if implemented)
4. Logs are shown in the terminal

Happy coding! 🎉
