# CI/CD Setup Guide for VocabMaster

This guide explains how to set up the GitHub Actions CI/CD pipelines for deploying VocabMaster to Vercel and Supabase.

## Required GitHub Secrets

Add these secrets in your GitHub repository: **Settings → Secrets and variables → Actions → New repository secret**

### Vercel Secrets

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `VERCEL_TOKEN` | Vercel API token | [Vercel Settings → Tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Your Vercel team/org ID | Run `vercel link` locally, check `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | Your Vercel project ID | Run `vercel link` locally, check `.vercel/project.json` |

### Supabase Secrets

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `SUPABASE_ACCESS_TOKEN` | Supabase access token | [Supabase Settings → Access Tokens](https://supabase.com/dashboard/account/tokens) |
| `SUPABASE_PROJECT_ID` | Project reference ID | Supabase Dashboard → Project Settings → General |
| `SUPABASE_DB_PASSWORD` | Database password | Supabase Dashboard → Project Settings → Database |

## Workflow Files

### 1. CI Workflow (`.github/workflows/ci.yml`)
- **Triggers:** Push to `main`/`develop`, Pull requests
- **Jobs:**
  - Lint & Type Check
  - Build verification

### 2. CD Workflow (`.github/workflows/cd.yml`)
- **Triggers:** Push to `main`, Pull requests to `main`
- **Jobs:**
  - Preview deployments for PRs
  - Production deployment for main branch

### 3. Deploy Workflow (`.github/workflows/deploy.yml`)
- **Triggers:** Push to `main` (when `supabase/` changes), Manual dispatch
- **Jobs:**
  - Supabase migrations
  - Vercel production deployment
  - Deployment notification

## Initial Setup Steps

### 1. Link Vercel Project

```bash
# Install Vercel CLI
npm install -g vercel

# Login and link project
vercel login
vercel link

# This creates .vercel/project.json with orgId and projectId
```

### 2. Link Supabase Project

```bash
# Install Supabase CLI
npm install -g supabase

# Login and link project
supabase login
supabase link --project-ref <your-project-ref>
```

### 3. Set Environment Variables in Vercel

Go to Vercel Dashboard → Project → Settings → Environment Variables:

```
DATABASE_TYPE = supabase
DATABASE_URL = postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
```

### 4. Run Initial Migration

```bash
# Push migrations to Supabase
supabase db push
```

## Deployment Flow

```
┌─────────────────┐
│   Push to main  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    CI Pipeline  │
│  (lint, build)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Supabase Migrate│
│ (if db changes) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Vercel Deploy  │
│  (production)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Live Site!    │
└─────────────────┘
```

## Manual Deployment

You can manually trigger deployments using the workflow dispatch:

1. Go to **Actions** tab in GitHub
2. Select **Deploy** workflow
3. Click **Run workflow**
4. Choose options:
   - Run migrations: yes/no
   - Deploy to Vercel: yes/no

## Troubleshooting

### Vercel deployment fails
- Check `VERCEL_TOKEN` is valid and not expired
- Ensure `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` are correct
- Verify environment variables are set in Vercel dashboard

### Supabase migration fails
- Check `SUPABASE_ACCESS_TOKEN` permissions
- Verify `SUPABASE_PROJECT_ID` matches your project
- Ensure database password is correct

### Build fails
- Check for TypeScript errors: `npx tsc --noEmit`
- Verify all dependencies are in `package.json`
- Check environment variables are available during build
