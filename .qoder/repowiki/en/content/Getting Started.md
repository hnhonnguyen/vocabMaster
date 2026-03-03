# Getting Started

<cite>
**Referenced Files in This Document**
- [package.json](file://package.json)
- [next.config.mjs](file://next.config.mjs)
- [app/page.tsx](file://app/page.tsx)
- [lib/db/index.ts](file://lib/db/index.ts)
- [lib/db/sqlite.ts](file://lib/db/sqlite.ts)
- [lib/db/postgresql.ts](file://lib/db/postgresql.ts)
- [lib/db/mysql.ts](file://lib/db/mysql.ts)
- [lib/db/supabase.ts](file://lib/db/supabase.ts)
- [lib/db/types.ts](file://lib/db/types.ts)
- [lib/storage.ts](file://lib/storage.ts)
- [lib/types.ts](file://lib/types.ts)
- [lib/spaced-repetition.ts](file://lib/spaced-repetition.ts)
- [app/api/words/route.ts](file://app/api/words/route.ts)
- [app/api/stats/route.ts](file://app/api/stats/route.ts)
- [components/add-word-dialog.tsx](file://components/add-word-dialog.tsx)
- [components/bulk-import-dialog.tsx](file://components/bulk-import-dialog.tsx)
- [vercel.json](file://vercel.json)
- [.env.example](file://.env.example)
- [supabase/config.toml](file://supabase/config.toml)
- [supabase/migrations/001_initial_schema.sql](file://supabase/migrations/001_initial_schema.sql)
- [supabase/seed.sql](file://supabase/seed.sql)
- [.github/DEPLOYMENT.md](file://.github/DEPLOYMENT.md)
</cite>

## Update Summary
**Changes Made**
- Removed Docker-based deployment section and replaced with new Supabase/Vercel deployment approach
- Updated deployment options to reflect the new cloud-native architecture using Supabase and Vercel
- Added comprehensive Supabase configuration and migration setup
- Updated environment variable configuration for cloud deployment
- Revised database initialization to support Supabase PostgreSQL backend
- Enhanced deployment documentation with CI/CD pipeline integration

## Table of Contents
1. [Introduction](#introduction)
2. [System Requirements](#system-requirements)
3. [Installation](#installation)
4. [Initial Configuration](#initial-configuration)
5. [Database Initialization](#database-initialization)
6. [First-Time Onboarding](#first-time-onboarding)
7. [Running the Application](#running-the-application)
8. [Adding Initial Vocabulary](#adding-initial-vocabulary)
9. [Verification Steps](#verification-steps)
10. [Troubleshooting](#troubleshooting)
11. [Deployment Options](#deployment-options)
12. [Manual Setup](#manual-setup)
13. [Automated Deployment](#automated-deployment)
14. [Supabase Configuration](#supabase-configuration)
15. [CI/CD Pipeline](#cicd-pipeline)
16. [Conclusion](#conclusion)

## Introduction
Welcome to VocabMaster, an AI-powered vocabulary learning application built with Next.js and deployed on modern cloud infrastructure. This guide walks you through installing, configuring, and using VocabMaster for the first time. You will set up the environment, configure Supabase database integration, deploy to Vercel, and add your first vocabulary words to start learning. The application now uses a cloud-native architecture with Supabase for database management and Vercel for deployment automation.

## System Requirements
- Node.js 18 or later
- npm (bundled with Node.js)
- Operating system: Windows, macOS, or Linux
- Git for version control and CI/CD integration
- Supabase account for database hosting
- Vercel account for deployment platform

The project supports multiple database backends through a unified interface, with Supabase being the recommended cloud deployment option.

**Section sources**
- [package.json](file://package.json#L11-L21)
- [next.config.mjs](file://next.config.mjs#L6-L11)

## Installation
Follow these steps to install VocabMaster locally:

1. Clone or download the repository to your machine.
2. Open a terminal in the project root directory.
3. Install dependencies:
   ```
   npm ci
   ```

This installs all required packages, including the Next.js framework, Tailwind CSS toolchain, and database drivers for PostgreSQL, MySQL, and SQLite.

**Section sources**
- [package.json](file://package.json#L5-L10)

## Initial Configuration
Environment variables are essential for cloud deployment. The application supports multiple deployment targets through environment configuration.

### Cloud Deployment Configuration
For Vercel + Supabase deployment (recommended):

```bash
# Database Configuration for Supabase
DATABASE_TYPE=supabase
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
```

### Development Configuration
For local development with SQLite:

```bash
# Development Database
DATABASE_TYPE=sqlite
DATABASE_URL=file:./data/vocab-master.db
```

### Self-Hosted Configuration
For PostgreSQL or MySQL deployments:

```bash
# PostgreSQL
DATABASE_TYPE=postgresql
DATABASE_URL=postgresql://username:password@host:port/database

# MySQL  
DATABASE_TYPE=mysql
DATABASE_URL=mysql://username:password@host:port/database
```

**Section sources**
- [.env.example](file://.env.example#L1-L61)

## Database Initialization
VocabMaster uses a flexible database abstraction layer supporting multiple backends. The database initialization process varies depending on your deployment target.

### Supabase Database (Cloud)
When `DATABASE_TYPE=supabase`, the application connects to a hosted PostgreSQL database through Supabase's connection pool. The database is automatically initialized with required tables and seed data.

### Local Database (Development)
For SQLite development, the database file is created automatically in the `data/` directory with proper indexing and seed data.

### Self-Hosted Databases
PostgreSQL and MySQL deployments require manual database setup with migration scripts provided in the `supabase/migrations/` directory.

**Section sources**
- [lib/db/index.ts](file://lib/db/index.ts#L18-L80)
- [lib/db/supabase.ts](file://lib/db/supabase.ts#L45-L72)
- [lib/db/sqlite.ts](file://lib/db/sqlite.ts#L35-L81)

## First-Time Onboarding
On first launch, the application loads data asynchronously and displays a dashboard. The onboarding experience varies slightly depending on your database backend.

### Supabase Deployment
- Automatically connects to Supabase database
- Seeds sample vocabulary words if the database is empty
- Initializes statistics tracking

### Local Deployment
- Creates SQLite database file if it doesn't exist
- Seeds sample vocabulary words
- Sets up performance indexes

The seeded sample words provide immediate content to practice with, regardless of deployment method.

**Section sources**
- [app/page.tsx](file://app/page.tsx#L41-L53)
- [app/page.tsx](file://app/page.tsx#L230-L236)
- [app/page.tsx](file://app/page.tsx#L178-L188)
- [lib/db/supabase.ts](file://lib/db/supabase.ts#L97-L142)
- [lib/db/sqlite.ts](file://lib/db/sqlite.ts#L83-L120)

## Running the Application
Start the development server:

```
npm run dev
```

Access the application at http://localhost:3000 in your browser.

How it works:
- Next.js serves the frontend and handles API routes
- Database backend is selected based on `DATABASE_TYPE` environment variable
- Supabase deployment uses connection pooling for optimal performance

**Section sources**
- [package.json](file://package.json#L5-L10)
- [next.config.mjs](file://next.config.mjs#L6-L11)

## Adding Initial Vocabulary
You can add vocabulary in two ways:

Option A: Add a single word
- Open the Add Word dialog from the header or the My Words page
- Enter the word, definition, and optional example sentence
- Choose the part of speech from the dropdown
- Submit to add the word to your collection

Option B: Bulk import
- Open the Bulk Import dialog from the header or the My Words page
- Paste or upload a text file containing words in supported formats
- Review the parsed words, select those to import, and optionally enrich missing definitions using AI
- Confirm the import to add multiple words at once

After adding words, they appear in your My Words list and become available for learning sessions.

**Section sources**
- [app/page.tsx](file://app/page.tsx#L169-L175)
- [app/page.tsx](file://app/page.tsx#L246-L258)
- [components/add-word-dialog.tsx](file://components/add-word-dialog.tsx#L96-L104)
- [components/bulk-import-dialog.tsx](file://components/bulk-import-dialog.tsx#L156-L196)

## Verification Steps
Confirm a successful setup by checking:

- The development server starts without errors
- The homepage loads and shows the dashboard
- The My Words list is populated (either with your own words or the sample words)
- You can add a test word and see it reflected in the list
- The Start Learning button is enabled when there are words due for review
- API routes respond correctly:
  - GET /api/words returns the list of words
  - GET /api/stats returns current statistics

If any step fails, refer to the Troubleshooting section.

**Section sources**
- [app/api/words/route.ts](file://app/api/words/route.ts#L4-L14)
- [app/api/stats/route.ts](file://app/api/stats/route.ts#L4-L13)
- [lib/storage.ts](file://lib/storage.ts#L5-L17)

## Troubleshooting
Common issues and fixes:

- Node.js version mismatch
  - Ensure you are using Node.js 18 or later. Lower versions may cause build or runtime errors
  - Verify with: node --version

- Database connection failures
  - For Supabase: verify DATABASE_URL contains valid connection string
  - For self-hosted: ensure database server is accessible and credentials are correct
  - Check network connectivity and firewall settings

- Permission denied when creating the database
  - For SQLite: ensure write permissions to the project folder
  - For cloud databases: verify database user has required privileges

- API route failures
  - Check that the development server is running
  - Verify that the API routes are reachable at /api/words and /api/stats
  - Inspect the browser network tab for error messages returned by the routes

- AI settings not taking effect
  - The AI configuration is stored in browser local storage. If changes are not applied, refresh the page or reset the configuration via the Settings dialog

**Section sources**
- [next.config.mjs](file://next.config.mjs#L6-L11)
- [lib/db/supabase.ts](file://lib/db/supabase.ts#L15-L26)
- [lib/db/sqlite.ts](file://lib/db/sqlite.ts#L8-L26)
- [app/api/words/route.ts](file://app/api/words/route.ts#L10-L13)
- [app/api/stats/route.ts](file://app/api/stats/route.ts#L11)

## Deployment Options
The application supports multiple deployment approaches designed for modern cloud infrastructure.

### Manual Setup
Local development and testing deployment:

1. Configure environment variables in `.env` file
2. Install dependencies: `npm ci`
3. Start development server: `npm run dev`
4. Access the application at http://localhost:3000

Requirements:
- Node.js 18+ environment
- Database credentials for your chosen backend
- Local database server (for non-Supabase deployments)

**Section sources**
- [package.json](file://package.json#L5-L10)
- [.env.example](file://.env.example#L1-L61)

### Automated Deployment
Production deployment through Vercel with Supabase integration:

1. Push code to your Git repository
2. Configure Vercel environment variables
3. Vercel automatically builds and deploys the application
4. Supabase handles database management and migrations

Benefits:
- Automatic scaling and load balancing
- Built-in SSL certificates
- Global CDN distribution
- Zero-downtime deployments

**Section sources**
- [vercel.json](file://vercel.json#L1-L39)
- [.github/DEPLOYMENT.md](file://.github/DEPLOYMENT.md#L88-L117)

## Supabase Configuration
Supabase provides managed PostgreSQL database hosting with automatic backups and monitoring.

### Local Development Setup
1. Install Supabase CLI: `npm install -g supabase`
2. Login to Supabase: `supabase login`
3. Link project: `supabase link --project-ref <your-project-ref>`
4. Run local database: `supabase start`

### Database Schema and Seed Data
The Supabase configuration includes:
- Initial schema with words and stats tables
- Performance indexes for optimal query performance
- Seed data with sample vocabulary words
- Migration support for schema updates

**Section sources**
- [supabase/config.toml](file://supabase/config.toml#L1-L68)
- [supabase/migrations/001_initial_schema.sql](file://supabase/migrations/001_initial_schema.sql#L1-L48)
- [supabase/seed.sql](file://supabase/seed.sql#L1-L24)

## CI/CD Pipeline
GitHub Actions automates the deployment process from development to production.

### Workflow Components
1. **CI Pipeline**: Validates code quality and builds the application
2. **CD Pipeline**: Deploys to preview environments for pull requests
3. **Production Deployment**: Deploys approved changes to production

### Required GitHub Secrets
- `VERCEL_TOKEN`: Vercel API access token
- `VERCEL_ORG_ID`: Your Vercel organization ID
- `VERCEL_PROJECT_ID`: Your Vercel project ID
- `SUPABASE_ACCESS_TOKEN`: Supabase access token
- `SUPABASE_PROJECT_ID`: Supabase project reference
- `SUPABASE_DB_PASSWORD`: Database password

### Deployment Flow
```mermaid
flowchart TD
A[Push to main] --> B[CI Pipeline]
B --> C{Database changes?}
C --> |Yes| D[Supabase Migrations]
C --> |No| E[Vercel Deploy]
D --> E
E --> F[Production Live]
```

**Diagram sources**
- [.github/DEPLOYMENT.md](file://.github/DEPLOYMENT.md#L88-L117)

**Section sources**
- [.github/DEPLOYMENT.md](file://.github/DEPLOYMENT.md#L1-L146)

## Conclusion
You are now ready to use VocabMaster with its modern cloud-native architecture. Install dependencies, configure environment variables for your preferred deployment target, and start the development server. Add vocabulary manually or import batches, then start learning sessions. Choose between local development with SQLite, self-hosted deployments with PostgreSQL/MySQL, or cloud deployment with Supabase and Vercel. The CI/CD pipeline ensures smooth deployments with automated testing and database migrations. For cloud deployments, leverage the comprehensive Supabase integration and Vercel hosting for scalable, production-ready applications.