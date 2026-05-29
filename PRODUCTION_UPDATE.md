# Production Update Script

Automated deployment script for updating all production services (Vercel + Railway) to match the main branch.

## Usage

```bash
./update-production.sh
```

## What it does

1. **Prerequisites Check** — Verifies git, vercel, and railway CLIs are installed
2. **Commit Changes** — Prompts to commit any uncommitted changes
3. **Push to GitHub** — Pushes main branch to origin
4. **Deploy Frontend** — Deploys to Vercel production
5. **Deploy API** — Deploys to Railway API service
6. **Deploy Worker** — Deploys to Railway Worker service
7. **Verify & Summary** — Checks deployment status and prints summary

## Services Updated

| Service | Platform | URL |
|---------|----------|-----|
| Frontend | Vercel | https://vedaai-assessment-creator-two.vercel.app |
| API | Railway | https://api-production-a331.up.railway.app |
| Worker | Railway | Same Railway project, service id: 46aa61e2 |

## Requirements

- **git** — Version control
- **vercel CLI** — Vercel deployments (required)
- **railway CLI** — Railway deployments (optional, will skip if not installed)

Install missing tools:

```bash
# Vercel CLI
npm i -g vercel@latest

# Railway CLI
npm i -g @railway/cli
```

## Environment Configuration

The script uses these hardcoded service IDs (from project memory):

```
Vercel Project: prj_nYUwixmBPAxWpp4AsifXLtzlFS8b
Railway Project: 9573efc6-4f49-4192-954a-8954d66a7f7b
Railway Environment: b9533dc1-932e-4769-97d3-ca6aeac0ad2e
API Service: 1de15265-5d77-44a3-ac5e-f4b38d84d3eb
Worker Service: 46aa61e2-c9a9-4ea0-8552-c4add79b43b6
```

To update these, edit the configuration section at the top of `update-production.sh`.

## Troubleshooting

### Vercel deployment fails
- Check: `vercel --prod` (standalone)
- Review: Build logs at https://vercel.com/thecuriouscatmeows-projects/vedaai-assessment-creator
- Common: Missing env vars — run `vercel env pull`

### Railway deployment fails
- Check: `railway link` — ensure logged in
- View: Railway dashboard at https://railway.app/project/$RAILWAY_PROJECT
- Logs: `railway logs --service api` or `railway logs --service worker`

### Both services fail
- Verify git status: `git status`
- Check GitHub branch: `git log --oneline -5`
- Ensure credentials: `vercel whoami` and `railway whoami`

## Manual Verification

After running the script, verify manually:

```bash
# Vercel status
vercel ls

# Railway status
railway status

# Check frontend
curl https://vedaai-assessment-creator-two.vercel.app

# Check API health
curl https://api-production-a331.up.railway.app/health
```
