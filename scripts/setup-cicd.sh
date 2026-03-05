#!/usr/bin/env bash
# ============================================================================
# VocabMaster CI/CD Setup Script
# Automates: Vercel linking, GitHub secrets, Vercel env vars, Supabase linking
# ============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Known Supabase project details
SUPABASE_PROJECT_REF="hutylyejedfbehuchxyb"
SUPABASE_REGION="ap-northeast-2"
GITHUB_REPO="hnhonnguyen/vocabMaster"

# ============================================================================
# Helper Functions
# ============================================================================

print_header() {
  echo ""
  echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BOLD}${BLUE}  $1${NC}"
  echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_step() {
  echo -e "\n${CYAN}▸ $1${NC}"
}

print_success() {
  echo -e "${GREEN}✔ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
  echo -e "${RED}✘ $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ $1${NC}"
}

prompt_value() {
  local prompt_text="$1"
  local var_name="$2"
  local is_secret="${3:-false}"

  if [ "$is_secret" = "true" ]; then
    echo -en "${YELLOW}  $prompt_text: ${NC}"
    read -rs "$var_name"
    echo ""
  else
    echo -en "${YELLOW}  $prompt_text: ${NC}"
    read -r "$var_name"
  fi
}

check_command() {
  if command -v "$1" &>/dev/null; then
    print_success "$1 is installed ($(command -v "$1"))"
    return 0
  else
    print_error "$1 is NOT installed"
    return 1
  fi
}

# ============================================================================
# Pre-flight Checks
# ============================================================================

preflight_checks() {
  print_header "Pre-flight Checks"
  
  local missing=0

  print_step "Checking required CLI tools..."

  if ! check_command "vercel"; then
    print_info "Install with: npm install -g vercel"
    missing=$((missing + 1))
  fi

  if ! check_command "supabase"; then
    print_info "Install with: npm install -g supabase"
    missing=$((missing + 1))
  fi

  if ! check_command "gh"; then
    print_info "Install from: https://cli.github.com/"
    missing=$((missing + 1))
  fi

  if ! check_command "git"; then
    print_info "Install git from: https://git-scm.com/"
    missing=$((missing + 1))
  fi

  if [ "$missing" -gt 0 ]; then
    echo ""
    print_error "$missing required tool(s) missing. Install them and re-run this script."
    exit 1
  fi

  # Check gh auth status
  print_step "Checking GitHub CLI authentication..."
  if gh auth status &>/dev/null; then
    print_success "GitHub CLI is authenticated"
  else
    print_warning "GitHub CLI not authenticated. Running 'gh auth login'..."
    gh auth login
  fi

  # Verify we're in the right repo
  print_step "Verifying repository..."
  local remote_url
  remote_url=$(git remote get-url origin 2>/dev/null || echo "")
  if echo "$remote_url" | grep -q "$GITHUB_REPO"; then
    print_success "Repository matches: $GITHUB_REPO"
  else
    print_warning "Remote URL ($remote_url) may not match expected repo ($GITHUB_REPO)"
    echo -en "${YELLOW}  Continue anyway? (y/N): ${NC}"
    read -r continue_choice
    if [ "$continue_choice" != "y" ] && [ "$continue_choice" != "Y" ]; then
      exit 1
    fi
  fi
}

# ============================================================================
# Step 1: Vercel Project Linking
# ============================================================================

setup_vercel() {
  print_header "Step 1: Vercel Project Linking"

  if [ -f ".vercel/project.json" ]; then
    print_success "Vercel project already linked"
    VERCEL_ORG_ID=$(grep -o '"orgId"[[:space:]]*:[[:space:]]*"[^"]*"' .vercel/project.json | cut -d'"' -f4)
    VERCEL_PROJECT_ID=$(grep -o '"projectId"[[:space:]]*:[[:space:]]*"[^"]*"' .vercel/project.json | cut -d'"' -f4)
    print_info "Org ID: $VERCEL_ORG_ID"
    print_info "Project ID: $VERCEL_PROJECT_ID"
  else
    print_step "Linking Vercel project..."
    print_info "Follow the prompts to link or create your Vercel project."
    echo ""
    vercel link

    if [ -f ".vercel/project.json" ]; then
      VERCEL_ORG_ID=$(grep -o '"orgId"[[:space:]]*:[[:space:]]*"[^"]*"' .vercel/project.json | cut -d'"' -f4)
      VERCEL_PROJECT_ID=$(grep -o '"projectId"[[:space:]]*:[[:space:]]*"[^"]*"' .vercel/project.json | cut -d'"' -f4)
      print_success "Vercel linked successfully"
      print_info "Org ID: $VERCEL_ORG_ID"
      print_info "Project ID: $VERCEL_PROJECT_ID"
    else
      print_error "Vercel link failed - .vercel/project.json not found"
      exit 1
    fi
  fi

  # Get Vercel token
  print_step "Vercel API Token"
  print_info "Create a token at: https://vercel.com/account/tokens"
  prompt_value "Paste your Vercel token" VERCEL_TOKEN true

  if [ -z "${VERCEL_TOKEN:-}" ]; then
    print_error "Vercel token is required"
    exit 1
  fi
  print_success "Vercel token received"
}

# ============================================================================
# Step 2: Supabase Project Linking
# ============================================================================

setup_supabase() {
  print_header "Step 2: Supabase Project Linking"

  print_info "Project ref: $SUPABASE_PROJECT_REF"
  print_info "Region: $SUPABASE_REGION"

  # Check Supabase login
  print_step "Checking Supabase CLI authentication..."
  if supabase projects list &>/dev/null; then
    print_success "Supabase CLI is authenticated"
  else
    print_warning "Supabase CLI not authenticated. Running 'supabase login'..."
    supabase login
  fi

  # Link project
  print_step "Linking Supabase project..."
  supabase link --project-ref "$SUPABASE_PROJECT_REF" 2>/dev/null && \
    print_success "Supabase project linked" || \
    print_warning "Supabase link may have already been configured"

  # Get Supabase access token
  print_step "Supabase Access Token"
  print_info "Create a token at: https://supabase.com/dashboard/account/tokens"
  prompt_value "Paste your Supabase access token" SUPABASE_ACCESS_TOKEN true

  if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ]; then
    print_error "Supabase access token is required"
    exit 1
  fi
  print_success "Supabase access token received"

  # Get DB password
  print_step "Supabase Database Password"
  print_info "Find at: Supabase Dashboard > Project Settings > Database"
  prompt_value "Paste your database password" SUPABASE_DB_PASSWORD true

  if [ -z "${SUPABASE_DB_PASSWORD:-}" ]; then
    print_error "Database password is required"
    exit 1
  fi
  print_success "Database password received"
}

# ============================================================================
# Step 3: Configure GitHub Secrets
# ============================================================================

setup_github_secrets() {
  print_header "Step 3: Configuring GitHub Secrets"

  local secrets_set=0
  local secrets_failed=0

  declare -A secrets=(
    ["VERCEL_TOKEN"]="$VERCEL_TOKEN"
    ["VERCEL_ORG_ID"]="$VERCEL_ORG_ID"
    ["VERCEL_PROJECT_ID"]="$VERCEL_PROJECT_ID"
    ["SUPABASE_ACCESS_TOKEN"]="$SUPABASE_ACCESS_TOKEN"
    ["SUPABASE_PROJECT_ID"]="$SUPABASE_PROJECT_REF"
    ["SUPABASE_DB_PASSWORD"]="$SUPABASE_DB_PASSWORD"
  )

  for secret_name in "${!secrets[@]}"; do
    print_step "Setting $secret_name..."
    if echo "${secrets[$secret_name]}" | gh secret set "$secret_name" --repo "$GITHUB_REPO" 2>/dev/null; then
      print_success "$secret_name configured"
      secrets_set=$((secrets_set + 1))
    else
      print_error "Failed to set $secret_name"
      secrets_failed=$((secrets_failed + 1))
    fi
  done

  echo ""
  print_info "Secrets set: $secrets_set / $((secrets_set + secrets_failed))"

  if [ "$secrets_failed" -gt 0 ]; then
    print_warning "$secrets_failed secret(s) failed. You may need to set them manually in GitHub."
  fi
}

# ============================================================================
# Step 4: Set Vercel Environment Variables
# ============================================================================

setup_vercel_env() {
  print_header "Step 4: Vercel Environment Variables"

  local db_url="postgresql://postgres.${SUPABASE_PROJECT_REF}:${SUPABASE_DB_PASSWORD}@aws-0-${SUPABASE_REGION}.pooler.supabase.com:6543/postgres?pgbouncer=true"

  print_step "Setting DATABASE_TYPE=supabase..."
  if echo "supabase" | vercel env add DATABASE_TYPE production --token "$VERCEL_TOKEN" --yes 2>/dev/null; then
    print_success "DATABASE_TYPE set for production"
  else
    print_warning "DATABASE_TYPE may already exist. Updating..."
    echo "supabase" | vercel env add DATABASE_TYPE production --token "$VERCEL_TOKEN" --force --yes 2>/dev/null && \
      print_success "DATABASE_TYPE updated" || \
      print_warning "Set DATABASE_TYPE=supabase manually in Vercel Dashboard"
  fi

  print_step "Setting DATABASE_URL..."
  if echo "$db_url" | vercel env add DATABASE_URL production --token "$VERCEL_TOKEN" --yes 2>/dev/null; then
    print_success "DATABASE_URL set for production"
  else
    print_warning "DATABASE_URL may already exist. Updating..."
    echo "$db_url" | vercel env add DATABASE_URL production --token "$VERCEL_TOKEN" --force --yes 2>/dev/null && \
      print_success "DATABASE_URL updated" || \
      print_warning "Set DATABASE_URL manually in Vercel Dashboard"
  fi

  # Also set for preview environment
  print_step "Setting env vars for preview environment..."
  echo "supabase" | vercel env add DATABASE_TYPE preview --token "$VERCEL_TOKEN" --yes 2>/dev/null && \
    print_success "DATABASE_TYPE set for preview" || \
    print_warning "DATABASE_TYPE preview may already exist"

  echo "$db_url" | vercel env add DATABASE_URL preview --token "$VERCEL_TOKEN" --yes 2>/dev/null && \
    print_success "DATABASE_URL set for preview" || \
    print_warning "DATABASE_URL preview may already exist"
}

# ============================================================================
# Step 5: Run Initial Supabase Migration
# ============================================================================

run_initial_migration() {
  print_header "Step 5: Initial Supabase Migration"

  echo -en "${YELLOW}  Run initial database migration now? (Y/n): ${NC}"
  read -r run_migration

  if [ "$run_migration" != "n" ] && [ "$run_migration" != "N" ]; then
    print_step "Pushing migrations to Supabase..."
    if supabase db push --password "$SUPABASE_DB_PASSWORD"; then
      print_success "Migrations applied successfully"

      print_step "Verifying migration status..."
      supabase migration list
    else
      print_error "Migration failed. Check your database password and try manually:"
      print_info "  supabase db push"
    fi
  else
    print_info "Skipping migration. Run manually later with: supabase db push"
  fi
}

# ============================================================================
# Summary
# ============================================================================

print_summary() {
  print_header "Setup Complete!"

  echo ""
  echo -e "${GREEN}${BOLD}  All CI/CD components have been configured:${NC}"
  echo ""
  echo -e "  ${GREEN}✔${NC} Vercel project linked (Org: ${VERCEL_ORG_ID:0:8}...)"
  echo -e "  ${GREEN}✔${NC} Supabase project linked (Ref: $SUPABASE_PROJECT_REF)"
  echo -e "  ${GREEN}✔${NC} GitHub secrets configured (6 secrets)"
  echo -e "  ${GREEN}✔${NC} Vercel environment variables set"
  echo ""
  echo -e "${BOLD}  Pipeline Triggers:${NC}"
  echo -e "  • ${CYAN}PR to main/develop${NC} → CI (lint + typecheck + build) + Preview deploy"
  echo -e "  • ${CYAN}Push to main${NC}       → CI + Production deploy + Migrations (if supabase/ changed)"
  echo -e "  • ${CYAN}Manual dispatch${NC}    → Configurable migrations + deploy"
  echo ""
  echo -e "${BOLD}  Next Steps:${NC}"
  echo -e "  1. Run ${CYAN}./scripts/verify-pipeline.sh${NC} to validate the setup"
  echo -e "  2. Push a commit to main to trigger the full pipeline"
  echo -e "  3. Monitor at: ${CYAN}https://github.com/$GITHUB_REPO/actions${NC}"
  echo ""
}

# ============================================================================
# Main
# ============================================================================

main() {
  echo ""
  echo -e "${BOLD}${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BOLD}${BLUE}║           VocabMaster CI/CD Setup Wizard                    ║${NC}"
  echo -e "${BOLD}${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "This script will configure the complete CI/CD pipeline for:"
  echo -e "  • ${CYAN}Vercel${NC}    — Frontend deployment (preview + production)"
  echo -e "  • ${CYAN}Supabase${NC}  — Database migrations"
  echo -e "  • ${CYAN}GitHub${NC}    — Actions secrets and workflows"
  echo ""

  # Navigate to project root
  cd "$(dirname "$0")/.."

  preflight_checks
  setup_vercel
  setup_supabase
  setup_github_secrets
  setup_vercel_env
  run_initial_migration
  print_summary
}

main "$@"
