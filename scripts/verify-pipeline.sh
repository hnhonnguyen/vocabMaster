#!/usr/bin/env bash
# ============================================================================
# VocabMaster CI/CD Pipeline Verification Script
# Validates: secrets, config files, CLI tools, workflows, and connectivity
# ============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

GITHUB_REPO="hnhonnguyen/vocabMaster"
SUPABASE_PROJECT_REF="hutylyejedfbehuchxyb"

PASS_COUNT=0
WARN_COUNT=0
FAIL_COUNT=0

pass() {
  echo -e "  ${GREEN}✔ PASS${NC}  $1"
  PASS_COUNT=$((PASS_COUNT + 1))
}

warn() {
  echo -e "  ${YELLOW}⚠ WARN${NC}  $1"
  WARN_COUNT=$((WARN_COUNT + 1))
}

fail() {
  echo -e "  ${RED}✘ FAIL${NC}  $1"
  FAIL_COUNT=$((FAIL_COUNT + 1))
}

section() {
  echo ""
  echo -e "${BOLD}${BLUE}── $1 ──${NC}"
}

# Navigate to project root
cd "$(dirname "$0")/.."

echo ""
echo -e "${BOLD}${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${BLUE}║        VocabMaster Pipeline Verification                    ║${NC}"
echo -e "${BOLD}${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"

# ============================================================================
# 1. CLI Tools
# ============================================================================
section "1. CLI Tools"

for tool in git node npm vercel supabase gh; do
  if command -v "$tool" &>/dev/null; then
    version=$("$tool" --version 2>/dev/null | head -1 || echo "unknown")
    pass "$tool ($version)"
  elif [ "$tool" = "supabase" ] && npx supabase --version &>/dev/null; then
    version=$(npx supabase --version 2>/dev/null | head -1 || echo "unknown")
    pass "$tool via npx ($version)"
  else
    if [ "$tool" = "vercel" ] || [ "$tool" = "supabase" ] || [ "$tool" = "gh" ]; then
      fail "$tool is not installed"
    else
      fail "$tool is not installed (critical)"
    fi
  fi
done

# ============================================================================
# 2. Project Structure
# ============================================================================
section "2. Project Structure"

# Required workflow files
for file in .github/workflows/ci.yml .github/workflows/cd.yml .github/workflows/deploy.yml; do
  if [ -f "$file" ]; then
    pass "Workflow: $file"
  else
    fail "Missing workflow: $file"
  fi
done

# Vercel config
if [ -f "vercel.json" ]; then
  pass "vercel.json exists"
else
  fail "vercel.json missing"
fi

# Vercel project link
if [ -f ".vercel/project.json" ]; then
  orgId=$(grep -o '"orgId"[[:space:]]*:[[:space:]]*"[^"]*"' .vercel/project.json | cut -d'"' -f4 || echo "")
  projectId=$(grep -o '"projectId"[[:space:]]*:[[:space:]]*"[^"]*"' .vercel/project.json | cut -d'"' -f4 || echo "")
  if [ -n "$orgId" ] && [ -n "$projectId" ]; then
    pass "Vercel linked (org: ${orgId:0:8}..., project: ${projectId:0:8}...)"
  else
    fail "Vercel project.json exists but missing orgId/projectId"
  fi
else
  fail "Vercel not linked (.vercel/project.json missing) — run 'vercel link'"
fi

# Supabase structure
if [ -f "supabase/config.toml" ]; then
  # Check if linked via .supabase directory or config has valid structure
  ref=$(grep -oP 'id\s*=\s*"\K[^"]+' supabase/config.toml 2>/dev/null || echo "")
  if [ "$ref" = "$SUPABASE_PROJECT_REF" ]; then
    pass "supabase/config.toml (project ref: $ref)"
  elif [ -f ".supabase/linked_project" ] || [ -n "$(grep -oP 'project_id\s*=\s*"\K[^"]+' supabase/.temp/project-ref 2>/dev/null)" ]; then
    pass "supabase/config.toml (project linked via CLI)"
  elif [ -z "$ref" ]; then
    # No project id in config is OK for CLI v2+ (uses supabase link instead)
    if grep -q "\[api\]" supabase/config.toml 2>/dev/null; then
      pass "supabase/config.toml (valid config, project linked via CLI)"
    else
      fail "supabase/config.toml appears invalid"
    fi
  elif [ "$ref" = "your-project-ref" ]; then
    fail "supabase/config.toml has placeholder project ref"
  else
    warn "supabase/config.toml project ref ($ref) differs from expected ($SUPABASE_PROJECT_REF)"
  fi
else
  fail "supabase/config.toml missing"
fi

# Migration files
migration_count=$(find supabase/migrations -name "*.sql" 2>/dev/null | wc -l)
if [ "$migration_count" -gt 0 ]; then
  pass "Found $migration_count migration file(s)"

  # Validate naming convention
  bad_names=0
  for f in supabase/migrations/*.sql; do
    basename=$(basename "$f")
    if ! echo "$basename" | grep -qP '^\d{14}_'; then
      warn "Migration '$basename' doesn't follow YYYYMMDDHHMMSS_ convention"
      bad_names=$((bad_names + 1))
    fi
  done
  if [ "$bad_names" -eq 0 ]; then
    pass "All migrations follow naming convention"
  fi
else
  warn "No migration files found in supabase/migrations/"
fi

if [ -f "supabase/seed.sql" ]; then
  pass "supabase/seed.sql exists"
else
  warn "supabase/seed.sql not found (optional)"
fi

# ============================================================================
# 3. GitHub Secrets
# ============================================================================
section "3. GitHub Secrets"

if command -v gh &>/dev/null && gh auth status &>/dev/null 2>&1; then
  # Get list of secrets
  secrets_list=$(gh secret list --repo "$GITHUB_REPO" 2>/dev/null || echo "")

  required_secrets=(
    "VERCEL_TOKEN"
    "VERCEL_ORG_ID"
    "VERCEL_PROJECT_ID"
    "SUPABASE_ACCESS_TOKEN"
    "SUPABASE_PROJECT_ID"
    "SUPABASE_DB_PASSWORD"
  )

  for secret in "${required_secrets[@]}"; do
    if echo "$secrets_list" | grep -q "^$secret"; then
      pass "Secret: $secret"
    else
      fail "Secret missing: $secret"
    fi
  done
else
  warn "Cannot verify GitHub secrets (gh CLI not authenticated)"
  warn "Run 'gh auth login' to enable secret verification"
fi

# ============================================================================
# 4. Workflow Syntax Validation
# ============================================================================
section "4. Workflow Configuration"

# Validate CI workflow
if [ -f ".github/workflows/ci.yml" ]; then
  if grep -q "npm run lint" .github/workflows/ci.yml && \
     grep -q "tsc --noEmit" .github/workflows/ci.yml && \
     grep -q "npm run build" .github/workflows/ci.yml; then
    pass "CI workflow has lint, typecheck, and build steps"
  else
    warn "CI workflow may be missing lint, typecheck, or build steps"
  fi

  if grep -q "pull_request" .github/workflows/ci.yml; then
    pass "CI workflow triggers on pull requests"
  else
    fail "CI workflow missing pull_request trigger"
  fi
fi

# Validate CD workflow
if [ -f ".github/workflows/cd.yml" ]; then
  if grep -q "deploy-preview" .github/workflows/cd.yml; then
    pass "CD workflow has preview deployment job"
  else
    fail "CD workflow missing preview deployment"
  fi

  if grep -q "deploy-production" .github/workflows/cd.yml; then
    pass "CD workflow has production deployment job"
  else
    fail "CD workflow missing production deployment"
  fi

  if grep -q "VERCEL_TOKEN" .github/workflows/cd.yml; then
    pass "CD workflow references VERCEL_TOKEN secret"
  else
    fail "CD workflow missing VERCEL_TOKEN reference"
  fi
fi

# Validate Deploy workflow
if [ -f ".github/workflows/deploy.yml" ]; then
  if grep -q "supabase-migrate" .github/workflows/deploy.yml; then
    pass "Deploy workflow has migration job"
  else
    fail "Deploy workflow missing migration job"
  fi

  if grep -q "workflow_dispatch" .github/workflows/deploy.yml; then
    pass "Deploy workflow supports manual dispatch"
  else
    warn "Deploy workflow missing manual dispatch trigger"
  fi

  if grep -q "SUPABASE_ACCESS_TOKEN" .github/workflows/deploy.yml; then
    pass "Deploy workflow references Supabase secrets"
  else
    fail "Deploy workflow missing Supabase secret references"
  fi
fi

# ============================================================================
# 5. Connectivity Checks
# ============================================================================
section "5. Connectivity"

# GitHub API
if gh api repos/"$GITHUB_REPO" --jq '.full_name' &>/dev/null 2>&1; then
  pass "GitHub API accessible for $GITHUB_REPO"
else
  if command -v gh &>/dev/null; then
    fail "Cannot access GitHub repo: $GITHUB_REPO"
  else
    warn "Cannot verify GitHub connectivity (gh not installed)"
  fi
fi

# Vercel API
if command -v vercel &>/dev/null; then
  if [ -f ".vercel/project.json" ]; then
    # Quick test with vercel whoami
    if vercel whoami &>/dev/null 2>&1; then
      pass "Vercel CLI authenticated"
    else
      warn "Vercel CLI not authenticated — run 'vercel login'"
    fi
  fi
fi

# Supabase API
if command -v supabase &>/dev/null; then
  if supabase projects list &>/dev/null 2>&1; then
    pass "Supabase CLI authenticated"
  else
    warn "Supabase CLI not authenticated — run 'supabase login'"
  fi
fi

# ============================================================================
# 6. Package.json Scripts
# ============================================================================
section "6. Build Configuration"

if [ -f "package.json" ]; then
  for script in dev build start lint; do
    if grep -q "\"$script\"" package.json; then
      pass "npm script: $script"
    else
      if [ "$script" = "lint" ]; then
        fail "Missing npm script: $script (required by CI)"
      else
        fail "Missing npm script: $script"
      fi
    fi
  done
else
  fail "package.json not found"
fi

# ============================================================================
# Summary
# ============================================================================
echo ""
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}  Verification Summary${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${GREEN}✔ Passed:${NC}   $PASS_COUNT"
echo -e "  ${YELLOW}⚠ Warnings:${NC} $WARN_COUNT"
echo -e "  ${RED}✘ Failed:${NC}   $FAIL_COUNT"
echo ""

TOTAL=$((PASS_COUNT + WARN_COUNT + FAIL_COUNT))
if [ "$FAIL_COUNT" -eq 0 ]; then
  if [ "$WARN_COUNT" -eq 0 ]; then
    echo -e "  ${GREEN}${BOLD}Pipeline is fully configured and ready!${NC}"
  else
    echo -e "  ${YELLOW}${BOLD}Pipeline is operational with $WARN_COUNT warning(s).${NC}"
  fi
  echo ""
  exit 0
else
  echo -e "  ${RED}${BOLD}Pipeline has $FAIL_COUNT issue(s) that must be resolved.${NC}"
  echo -e "  Run ${CYAN}./scripts/setup-cicd.sh${NC} to fix configuration issues."
  echo ""
  exit 1
fi
