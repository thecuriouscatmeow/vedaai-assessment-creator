#!/bin/bash

##############################################################################
# VedaAI Production Update Script
# Updates all services (Vercel + Railway) to match main branch
##############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
VERCEL_PROJECT="prj_nYUwixmBPAxWpp4AsifXLtzlFS8b"
RAILWAY_PROJECT="9573efc6-4f49-4192-954a-8954d66a7f7b"
RAILWAY_ENV="b9533dc1-932e-4769-97d3-ca6aeac0ad2e"
API_SERVICE="1de15265-5d77-44a3-ac5e-f4b38d84d3eb"
WORKER_SERVICE="46aa61e2-c9a9-4ea0-8552-c4add79b43b6"
GITHUB_REPO="thecuriouscatmeow/vedaai-assessment-creator"

# Helper functions
log_section() {
    echo ""
    echo -e "${BLUE}▶ $1${NC}"
}

log_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

log_error() {
    echo -e "${RED}✗ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log_section "Checking prerequisites..."

    # Check git
    if ! command -v git &> /dev/null; then
        log_error "git not found"
        exit 1
    fi
    log_success "git found"

    # Check vercel
    if ! command -v vercel &> /dev/null; then
        log_error "vercel CLI not found. Run: npm i -g vercel@latest"
        exit 1
    fi
    log_success "vercel CLI found"

    # Check railway
    if ! command -v railway &> /dev/null; then
        log_warning "railway CLI not found. Skipping Railway deployment (manual redeploy needed)"
        SKIP_RAILWAY=true
    else
        log_success "railway CLI found"
        SKIP_RAILWAY=false
    fi
}

# Check and commit uncommitted changes
commit_changes() {
    log_section "Checking git status..."

    if ! git diff --quiet || ! git diff --cached --quiet; then
        log_warning "Uncommitted changes detected"
        read -p "Commit before deploying? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git add -A
            git commit -m "chore: production update - $(date +%Y-%m-%d\ %H:%M:%S)"
            log_success "Changes committed"
        else
            log_error "Cannot deploy with uncommitted changes"
            exit 1
        fi
    else
        log_success "No uncommitted changes"
    fi
}

# Push to GitHub
push_to_github() {
    log_section "Pushing to GitHub..."

    COMMITS_AHEAD=$(git rev-list --count origin/main..main 2>/dev/null || echo "0")

    if [ "$COMMITS_AHEAD" -eq 0 ]; then
        log_success "Already up to date with origin/main"
        return
    fi

    log_warning "$COMMITS_AHEAD commit(s) ahead of origin/main"
    git push origin main
    log_success "Pushed to GitHub"
}

# Deploy to Vercel
deploy_vercel() {
    log_section "Deploying to Vercel (frontend)..."

    OUTPUT=$(vercel --prod 2>&1)

    if echo "$OUTPUT" | grep -q "READY"; then
        VERCEL_URL=$(echo "$OUTPUT" | grep "Production" | grep -o 'https://[^ ]*' | head -1)
        log_success "Vercel deployment complete: $VERCEL_URL"
        echo "$VERCEL_URL"
    else
        log_error "Vercel deployment failed"
        echo "$OUTPUT"
        exit 1
    fi
}

# Deploy to Railway (API service)
deploy_railway_api() {
    log_section "Deploying to Railway (API service)..."

    if [ "$SKIP_RAILWAY" = true ]; then
        log_warning "Railway CLI not available - skipping"
        return
    fi

    # Link to the correct project
    railway link --project "$RAILWAY_PROJECT" --environment "$RAILWAY_ENV" --service "$API_SERVICE" 2>/dev/null || true

    # Trigger deployment using railway deploy
    DEPLOY_OUTPUT=$(railway deploy --detach 2>&1)

    if echo "$DEPLOY_OUTPUT" | grep -q "Deployment"; then
        log_success "Railway API deployment triggered"
        echo "$DEPLOY_OUTPUT" | grep -i "deployment\|ready\|error" || true
    else
        log_warning "Could not verify Railway API deployment: $DEPLOY_OUTPUT"
    fi
}

# Deploy to Railway (Worker service)
deploy_railway_worker() {
    log_section "Deploying to Railway (Worker service)..."

    if [ "$SKIP_RAILWAY" = true ]; then
        log_warning "Railway CLI not available - skipping"
        return
    fi

    # Link to worker service
    railway link --project "$RAILWAY_PROJECT" --environment "$RAILWAY_ENV" --service "$WORKER_SERVICE" 2>/dev/null || true

    # Trigger deployment
    DEPLOY_OUTPUT=$(railway deploy --detach 2>&1)

    if echo "$DEPLOY_OUTPUT" | grep -q "Deployment"; then
        log_success "Railway Worker deployment triggered"
        echo "$DEPLOY_OUTPUT" | grep -i "deployment\|ready\|error" || true
    else
        log_warning "Could not verify Railway Worker deployment: $DEPLOY_OUTPUT"
    fi
}

# Verify deployments
verify_deployments() {
    log_section "Verifying deployments..."

    # Check Vercel
    if command -v vercel &> /dev/null; then
        VERCEL_STATUS=$(vercel ls --json 2>/dev/null | head -1)
        if echo "$VERCEL_STATUS" | grep -q "ready\|READY"; then
            log_success "Vercel: Production deployment ready"
        else
            log_warning "Vercel: Could not verify status"
        fi
    fi

    # Check Railway
    if [ "$SKIP_RAILWAY" = false ] && command -v railway &> /dev/null; then
        railway link --project "$RAILWAY_PROJECT" --environment "$RAILWAY_ENV" 2>/dev/null || true
        RAILWAY_STATUS=$(railway status 2>&1 | head -20)
        if echo "$RAILWAY_STATUS" | grep -q "ready\|READY\|running"; then
            log_success "Railway: Services deployed"
        else
            log_warning "Railway: Could not verify status - check dashboard"
        fi
    fi
}

# Print summary
print_summary() {
    log_section "Deployment Summary"

    COMMIT=$(git rev-parse --short HEAD)
    DATE=$(date)

    echo ""
    echo "Commit: $COMMIT"
    echo "Time: $DATE"
    echo ""
    echo "Services updated:"
    echo "  - Frontend (Vercel): https://vedaai-assessment-creator-two.vercel.app"
    echo "  - API (Railway): https://api-production-a331.up.railway.app"
    echo "  - Worker (Railway): same project"
    echo ""

    if [ "$SKIP_RAILWAY" = true ]; then
        log_warning "Railway CLI not available - deployments may still be in progress"
        echo "Check Railway dashboard: https://railway.app/project/$RAILWAY_PROJECT"
    fi

    log_success "Production update complete!"
}

# Main execution
main() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║        VedaAI Production Update - All Services        ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"

    check_prerequisites
    commit_changes
    push_to_github
    deploy_vercel
    deploy_railway_api
    deploy_railway_worker
    verify_deployments
    print_summary
}

# Run main function
main "$@"
