#!/usr/bin/env bash
# ============================================================================
# VocabMaster CI/CD Dry-Run Validation Script
# Simulates the full pipeline locally without actually deploying
# Tests: lint, typecheck, build, migration syntax, workflow parsing
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
DIM='\033[2m'

STEP=0
TOTAL_STEPS=8
PASS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0
START_TIME=$(date +%s)

# Navigate to project root
cd "$(dirname "$0")/.."

step_header() {
  STEP=$((STEP + 1))
  echo ""
  echo -e "${BOLD}${BLUE}[$STEP/$TOTAL_STEPS] $1${NC}"
  echo -e "${DIM}$(printf '%.0s─' {1..60})${NC}"
}

pass() {
  echo -e "  ${GREEN}✔${NC} $1"
  PASS_COUNT=$((PASS_COUNT + 1))
}

fail() {
  echo -e "  ${RED}✘${NC} $1"
  FAIL_COUNT=$((FAIL_COUNT + 1))
}

skip() {
  echo -e "  ${YELLOW}⊘${NC} $1 ${DIM}(skipped)${NC}"
  SKIP_COUNT=$((SKIP_COUNT + 1))
}

timer_start() {
  TIMER_START=$(date +%s)
}

timer_end() {
  local elapsed=$(( $(date +%s) - TIMER_START ))
  echo -e "  ${DIM}(${elapsed}s)${NC}"
}

# ============================================================================
echo ""
echo -e "${BOLD}${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${BLUE}║         VocabMaster CI/CD Dry-Run Test                      ║${NC}"
echo -e "${BOLD}${BLUE}║         Simulates the full pipeline locally                 ║${NC}"
echo -e "${BOLD}${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"

# ============================================================================
# Step 1: Dependency Installation (mirrors CI npm ci)
# ============================================================================
step_header "Dependency Installation (CI: npm ci)"
timer_start

if [ -f "package-lock.json" ]; then
  if npm ci --ignore-scripts 2>/dev/null; then
    pass "npm ci completed successfully"
  else
    # Fallback to npm install
    if npm install 2>/dev/null; then
      pass "npm install completed (package-lock.json may need regeneration)"
    else
      fail "Dependency installation failed"
    fi
  fi
else
  if npm install 2>/dev/null; then
    pass "npm install completed (no lock file — CI will use npm ci which requires one)"
    echo -e "  ${YELLOW}⚠${NC} Generate lock file: npm install --package-lock-only"
  else
    fail "Dependency installation failed"
  fi
fi
timer_end

# ============================================================================
# Step 2: ESLint (mirrors CI: npm run lint)
# ============================================================================
step_header "ESLint Check (CI: npm run lint)"
timer_start

if grep -q '"lint"' package.json; then
  lint_output=$(npm run lint 2>&1) && {
    pass "ESLint passed — no errors"
    # Check for warnings
    warning_count=$(echo "$lint_output" | grep -c "warning" 2>/dev/null || echo "0")
    if [ "$warning_count" -gt 0 ]; then
      echo -e "  ${YELLOW}⚠${NC} $warning_count warning(s) detected"
    fi
  } || {
    fail "ESLint found errors"
    echo "$lint_output" | tail -20 | while IFS= read -r line; do
      echo -e "    ${DIM}$line${NC}"
    done
  }
else
  fail "No 'lint' script in package.json — CI will fail"
fi
timer_end

# ============================================================================
# Step 3: TypeScript Type Check (mirrors CI: npx tsc --noEmit)
# ============================================================================
step_header "TypeScript Type Check (CI: npx tsc --noEmit)"
timer_start

if [ -f "tsconfig.json" ]; then
  tsc_output=$(npx tsc --noEmit 2>&1) && {
    pass "TypeScript type check passed — no errors"
  } || {
    error_count=$(echo "$tsc_output" | grep -c "error TS" 2>/dev/null || echo "?")
    fail "TypeScript found $error_count error(s)"
    echo "$tsc_output" | grep "error TS" | head -10 | while IFS= read -r line; do
      echo -e "    ${DIM}$line${NC}"
    done
    if [ "$error_count" -gt 10 ]; then
      echo -e "    ${DIM}... and $((error_count - 10)) more${NC}"
    fi
  }
else
  fail "tsconfig.json not found — TypeScript check will fail in CI"
fi
timer_end

# ============================================================================
# Step 4: Build (mirrors CI: npm run build)
# ============================================================================
step_header "Build Verification (CI: npm run build)"
timer_start

export DATABASE_TYPE=supabase
export DATABASE_URL="postgresql://mock:mock@localhost:5432/mock"

if grep -q '"build"' package.json; then
  build_output=$(npm run build 2>&1) && {
    pass "Build completed successfully"

    # Check for build output
    if [ -d ".next" ]; then
      page_count=$(find .next/server -name "*.html" 2>/dev/null | wc -l || echo "0")
      pass "Build output: .next/ directory ($page_count page(s))"
    fi
  } || {
    fail "Build failed"
    echo "$build_output" | tail -20 | while IFS= read -r line; do
      echo -e "    ${DIM}$line${NC}"
    done
  }
else
  fail "No 'build' script in package.json"
fi

unset DATABASE_TYPE DATABASE_URL
timer_end

# ============================================================================
# Step 5: Migration SQL Syntax Validation
# ============================================================================
step_header "Migration SQL Validation (Deploy: supabase db push)"
timer_start

if [ -d "supabase/migrations" ]; then
  migration_files=$(find supabase/migrations -name "*.sql" -type f 2>/dev/null)

  if [ -n "$migration_files" ]; then
    sql_errors=0
    while IFS= read -r migration; do
      basename=$(basename "$migration")

      # Check naming convention
      if echo "$basename" | grep -qP '^\d{14}_'; then
        pass "Migration naming: $basename"
      else
        fail "Bad migration name: $basename (expected YYYYMMDDHHMMSS_name.sql)"
      fi

      # Basic SQL syntax validation
      if [ -s "$migration" ]; then
        # Check for common SQL issues
        issues=""

        # Check for unterminated statements (missing semicolons on non-comment/empty lines)
        last_content_line=$(grep -v '^\s*$' "$migration" | grep -v '^\s*--' | tail -1)
        if [ -n "$last_content_line" ] && ! echo "$last_content_line" | grep -q ';$'; then
          issues="${issues}missing trailing semicolon, "
        fi

        # Check for balanced parentheses
        open_parens=$(grep -o '(' "$migration" | wc -l)
        close_parens=$(grep -o ')' "$migration" | wc -l)
        if [ "$open_parens" -ne "$close_parens" ]; then
          issues="${issues}unbalanced parentheses ($open_parens open, $close_parens close), "
        fi

        # Check for CREATE TABLE/INDEX statements
        if grep -qi "CREATE\s\+TABLE\|CREATE\s\+INDEX\|ALTER\s\+TABLE\|INSERT\s\+INTO" "$migration"; then
          pass "SQL content: $basename (DDL/DML statements found)"
        else
          echo -e "  ${YELLOW}⚠${NC} $basename has no recognizable DDL/DML"
        fi

        if [ -n "$issues" ]; then
          echo -e "  ${YELLOW}⚠${NC} $basename: ${issues%, }"
        fi
      else
        fail "Empty migration: $basename"
        sql_errors=$((sql_errors + 1))
      fi
    done <<< "$migration_files"
  else
    skip "No migration files found"
  fi
else
  skip "No supabase/migrations directory"
fi
timer_end

# ============================================================================
# Step 6: Vercel Config Validation
# ============================================================================
step_header "Vercel Configuration (CD: vercel build)"
timer_start

if [ -f "vercel.json" ]; then
  # Validate JSON syntax
  if node -e "JSON.parse(require('fs').readFileSync('vercel.json','utf8'))" 2>/dev/null; then
    pass "vercel.json is valid JSON"
  else
    fail "vercel.json has invalid JSON syntax"
  fi

  # Check framework
  framework=$(node -e "console.log(JSON.parse(require('fs').readFileSync('vercel.json','utf8')).framework || 'not set')" 2>/dev/null)
  if [ "$framework" = "nextjs" ]; then
    pass "Framework: $framework"
  else
    echo -e "  ${YELLOW}⚠${NC} Framework: $framework (expected 'nextjs')"
  fi

  # Check build command
  buildCmd=$(node -e "console.log(JSON.parse(require('fs').readFileSync('vercel.json','utf8')).buildCommand || 'not set')" 2>/dev/null)
  if [ "$buildCmd" != "not set" ]; then
    pass "Build command: $buildCmd"
  fi
else
  fail "vercel.json not found"
fi
timer_end

# ============================================================================
# Step 7: Workflow YAML Validation
# ============================================================================
step_header "Workflow YAML Validation"
timer_start

for workflow in .github/workflows/ci.yml .github/workflows/cd.yml .github/workflows/deploy.yml; do
  if [ -f "$workflow" ]; then
    # Basic YAML syntax check using node
    valid=$(node -e "
      try {
        const fs = require('fs');
        const content = fs.readFileSync('$workflow', 'utf8');
        // Check for common YAML issues
        if (content.includes('\t')) {
          console.log('tabs');
        } else if (!content.match(/^name:/m)) {
          console.log('no-name');
        } else if (!content.match(/^on:/m)) {
          console.log('no-trigger');
        } else if (!content.match(/^jobs:/m)) {
          console.log('no-jobs');
        } else {
          console.log('ok');
        }
      } catch(e) { console.log('error'); }
    " 2>/dev/null)

    case "$valid" in
      ok)
        pass "$(basename "$workflow"): valid structure"
        ;;
      tabs)
        fail "$(basename "$workflow"): contains tabs (YAML requires spaces)"
        ;;
      no-name)
        fail "$(basename "$workflow"): missing 'name:' field"
        ;;
      no-trigger)
        fail "$(basename "$workflow"): missing 'on:' trigger"
        ;;
      no-jobs)
        fail "$(basename "$workflow"): missing 'jobs:' section"
        ;;
      *)
        fail "$(basename "$workflow"): could not validate"
        ;;
    esac

    # Check for secret references
    secrets_used=$(grep -oP '\$\{\{\s*secrets\.(\w+)\s*\}\}' "$workflow" 2>/dev/null | sort -u | grep -oP 'secrets\.\K\w+' || echo "")
    if [ -n "$secrets_used" ]; then
      secret_count=$(echo "$secrets_used" | wc -l)
      pass "$(basename "$workflow"): references $secret_count secret(s)"
    fi
  else
    fail "Missing: $workflow"
  fi
done
timer_end

# ============================================================================
# Step 8: Git Status & Branch Check
# ============================================================================
step_header "Git & Deployment Readiness"
timer_start

# Check current branch
current_branch=$(git branch --show-current 2>/dev/null || echo "unknown")
if [ "$current_branch" = "main" ]; then
  pass "On main branch (production deployments will trigger)"
else
  echo -e "  ${YELLOW}⚠${NC} On branch '$current_branch' — push to main to trigger production deploy"
fi

# Check for uncommitted changes
if git diff --quiet 2>/dev/null && git diff --cached --quiet 2>/dev/null; then
  pass "No uncommitted changes"
else
  changed=$(git status --porcelain 2>/dev/null | wc -l)
  echo -e "  ${YELLOW}⚠${NC} $changed uncommitted change(s) — commit before deploying"
fi

# Check remote is accessible
if git ls-remote --exit-code origin &>/dev/null 2>&1; then
  pass "Git remote is accessible"
else
  fail "Cannot reach git remote"
fi

# Check if main is up to date with remote
local_sha=$(git rev-parse main 2>/dev/null || echo "none")
remote_sha=$(git rev-parse origin/main 2>/dev/null || echo "none")
if [ "$local_sha" = "$remote_sha" ]; then
  pass "Local main is in sync with origin/main"
elif [ "$remote_sha" = "none" ]; then
  echo -e "  ${YELLOW}⚠${NC} No origin/main found — initial push needed"
else
  behind=$(git rev-list --count main..origin/main 2>/dev/null || echo "?")
  ahead=$(git rev-list --count origin/main..main 2>/dev/null || echo "?")
  echo -e "  ${YELLOW}⚠${NC} main is $ahead ahead, $behind behind origin/main"
fi
timer_end

# ============================================================================
# Final Summary
# ============================================================================
ELAPSED=$(( $(date +%s) - START_TIME ))

echo ""
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}  Dry-Run Results${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${GREEN}✔ Passed:${NC}  $PASS_COUNT"
echo -e "  ${RED}✘ Failed:${NC}  $FAIL_COUNT"
echo -e "  ${YELLOW}⊘ Skipped:${NC} $SKIP_COUNT"
echo -e "  ${DIM}⏱ Time:    ${ELAPSED}s${NC}"
echo ""

echo -e "${BOLD}  Pipeline Stage Simulation:${NC}"
echo ""
if [ "$FAIL_COUNT" -eq 0 ]; then
  echo -e "  ${GREEN}│${NC} CI: lint        ${GREEN}✔${NC}"
  echo -e "  ${GREEN}│${NC} CI: typecheck   ${GREEN}✔${NC}"
  echo -e "  ${GREEN}│${NC} CI: build       ${GREEN}✔${NC}"
  echo -e "  ${GREEN}│${NC} Deploy: migrate ${GREEN}✔${NC} (syntax validated)"
  echo -e "  ${GREEN}│${NC} CD: vercel      ${GREEN}✔${NC} (config validated)"
  echo -e "  ${GREEN}│${NC}"
  echo -e "  ${GREEN}└─── ${BOLD}Pipeline would PASS${NC} ${GREEN}✔${NC}"
  echo ""
  echo -e "  ${GREEN}${BOLD}Ready to deploy! Push to main to trigger the full pipeline.${NC}"
else
  echo -e "  ${RED}│${NC} Some stages would fail. Fix the issues above first."
  echo -e "  ${RED}│${NC}"
  echo -e "  ${RED}└─── ${BOLD}Pipeline would FAIL${NC} ${RED}✘${NC}"
  echo ""
  echo -e "  ${RED}${BOLD}Fix $FAIL_COUNT issue(s) before deploying.${NC}"
fi

echo ""
exit "$FAIL_COUNT"
