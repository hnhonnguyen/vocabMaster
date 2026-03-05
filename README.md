# VocabMaster

An AI-powered vocabulary learning application that uses the **SM-2 spaced repetition algorithm** to help you master English vocabulary efficiently. Built with Next.js 14, TypeScript, and Tailwind CSS, with flexible multi-database support and deployment options.

---

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
- [Usage](#usage)
  - [Adding Words](#adding-words)
  - [Learning Mode](#learning-mode)
  - [Spaced Repetition (SM-2)](#spaced-repetition-sm-2)
  - [AI Features](#ai-features)
- [API Endpoints](#api-endpoints)
  - [Words](#words)
  - [Statistics](#statistics)
- [Database](#database)
  - [Schema](#schema)
  - [Supported Databases](#supported-databases)
- [Deployment](#deployment)
  - [Vercel + Supabase (Recommended)](#vercel--supabase-recommended)
  - [Docker (Self-Hosted)](#docker-self-hosted)
  - [CI/CD with GitHub Actions](#cicd-with-github-actions)
- [Development](#development)
- [License](#license)

---

## Features

- **Spaced Repetition Learning** -- SM-2 algorithm optimizes review intervals for long-term retention
- **Interactive Learning Sessions** -- Multiple question types: fill-in-the-blank, definition matching, synonyms, and context usage
- **Vocabulary Management** -- Add words individually or bulk import via CSV/JSON
- **AI-Powered Assistance** (optional) -- Word lookup, contextual question generation, and answer evaluation using any OpenAI-compatible API
- **Progress Tracking** -- Dashboard with learning streaks, mastery percentage, and word categories (New, Learning, Mastered, Due Today)
- **Multi-Database Support** -- Supabase PostgreSQL, PostgreSQL, MySQL, or SQLite
- **Flexible Deployment** -- Vercel (cloud) or Docker (self-hosted)
- **Responsive Design** -- Works on desktop and mobile devices

---

## Technology Stack

| Layer       | Technology                                              |
| ----------- | ------------------------------------------------------- |
| Framework   | [Next.js 14](https://nextjs.org/) (App Router)         |
| Language    | [TypeScript 5](https://www.typescriptlang.org/)        |
| Styling     | [Tailwind CSS 3.4](https://tailwindcss.com/)           |
| Icons       | [Lucide React](https://lucide.dev/)                    |
| UI Utilities| class-variance-authority, clsx, tailwind-merge          |
| Databases   | Supabase PostgreSQL, PostgreSQL 15, MySQL 8.0, SQLite  |
| Deployment  | Vercel, Docker, GitHub Actions                          |

---

## Project Structure

```
vocabMaster/
├── app/
│   ├── layout.tsx                 # Root layout with metadata
│   ├── page.tsx                   # Main application page
│   ├── globals.css                # Global styles
│   └── api/
│       ├── words/
│       │   ├── route.ts           # GET all words / POST new word
│       │   ├── [id]/route.ts      # GET / PUT / DELETE a word by ID
│       │   └── bulk/route.ts      # POST bulk import
│       └── stats/
│           └── route.ts           # GET / PUT learning statistics
├── components/
│   ├── dashboard.tsx              # Stats overview component
│   ├── learning-mode.tsx          # Interactive learning session
│   ├── add-word-dialog.tsx        # Add single word dialog
│   ├── bulk-import-dialog.tsx     # Bulk import dialog (CSV/JSON)
│   ├── word-list.tsx              # Word list with management
│   ├── settings-dialog.tsx        # Settings and configuration
│   ├── session-complete.tsx       # Session completion screen
│   └── ui/                        # Reusable UI primitives
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── textarea.tsx
│       ├── badge.tsx
│       └── progress.tsx
├── lib/
│   ├── types.ts                   # TypeScript interfaces
│   ├── config.ts                  # AI API configuration
│   ├── storage.ts                 # API client functions
│   ├── spaced-repetition.ts       # SM-2 algorithm implementation
│   ├── ai-service.ts              # OpenAI-compatible API integration
│   ├── question-generator.ts      # Question generation (AI + fallback)
│   ├── dictionary-service.ts      # Word lookup service
│   ├── utils.ts                   # Utility functions
│   └── db/
│       ├── index.ts               # Database factory pattern
│       ├── types.ts               # IDatabase interface
│       ├── supabase.ts            # Supabase implementation
│       ├── postgresql.ts          # PostgreSQL implementation
│       ├── mysql.ts               # MySQL implementation
│       └── sqlite.ts              # SQLite implementation
├── supabase/
│   ├── config.toml                # Supabase CLI config
│   ├── seed.sql                   # Seed data
│   └── migrations/                # Database migrations
├── init/
│   ├── postgres/init.sql          # PostgreSQL schema init
│   └── mysql/init.sql             # MySQL schema init
├── scripts/
│   ├── setup-cicd.sh              # CI/CD setup automation
│   ├── verify-pipeline.sh         # Pipeline verification
│   └── dry-run-pipeline.sh        # Test pipeline execution
├── .github/workflows/
│   ├── ci.yml                     # Lint & build checks
│   ├── cd.yml                     # Preview & production deploy
│   └── deploy.yml                 # Supabase & Vercel deploy
├── docker-compose.yml             # Multi-database Docker setup
├── Dockerfile                     # Application container
├── vercel.json                    # Vercel deployment config
└── setup.sh                       # Docker setup script
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 18
- **npm** >= 9 (or yarn/pnpm)
- **Docker** (optional, for self-hosted deployment)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/vocabMaster.git
cd vocabMaster

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start the development server
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Environment Variables

Create a `.env` file in the project root. See [`.env.example`](.env.example) for the full template.

#### Vercel + Supabase (Recommended)

```env
DATABASE_TYPE=supabase
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
```

#### Docker + PostgreSQL

```env
DATABASE_TYPE=postgresql
DATABASE_URL=postgresql://vocabuser:vocabbuddy2024@postgres:5432/vocabmaster
POSTGRES_DB=vocabmaster
POSTGRES_USER=vocabuser
POSTGRES_PASSWORD=vocabbuddy2024
```

#### Docker + MySQL

```env
DATABASE_TYPE=mysql
DATABASE_URL=mysql://vocabuser:vocabbuddy2024@mysql:3306/vocabmaster
MYSQL_DB=vocabmaster
MYSQL_USER=vocabuser
MYSQL_PASSWORD=vocabbuddy2024
MYSQL_ROOT_PASSWORD=rootpassword
```

#### Docker + SQLite (Default)

```env
DATABASE_TYPE=sqlite
DATABASE_URL=file:./data/vocab-master.db
```

#### AI Features (Optional)

AI settings are configured via the in-app **Settings** dialog and stored in `localStorage`:

| Setting        | Description                              | Example                          |
| -------------- | ---------------------------------------- | -------------------------------- |
| API Key        | Your OpenAI-compatible API key           | `sk-...`                         |
| Base URL       | API base URL                             | `https://api.openai.com/v1`     |
| Model          | Language model to use                    | `gpt-4`                         |

---

## Usage

### Adding Words

- **Single word**: Click the **Add Word** button to enter a word with its definition, example sentence, and part of speech. If AI is configured, word definitions can be auto-looked up.
- **Bulk import**: Use the **Bulk Import** dialog to import multiple words at once in CSV or JSON format.

### Learning Mode

1. Click **Start Learning** to begin a review session with words due for review.
2. Answer questions of varying types (fill-in-the-blank, definition, synonym, context usage).
3. Rate your recall quality on a 0--5 scale after each card.
4. The SM-2 algorithm automatically adjusts the next review date based on your performance.
5. View your session summary upon completion.

### Spaced Repetition (SM-2)

VocabMaster uses the [SuperMemo 2 (SM-2)](https://en.wikipedia.org/wiki/SuperMemo#Description_of_SM-2_algorithm) algorithm:

- **Ease Factor** starts at 2.5 and adjusts based on recall quality (minimum 1.3).
- **Review intervals** progress as: 1 day -> 6 days -> `interval * easeFactor`.
- **Failed reviews** (quality < 3) reset the interval to 1 day.
- **Mastery score** (0--100%) is calculated from repetitions, ease factor, and interval length.

### AI Features

When an OpenAI-compatible API key is configured:

- **Smart word lookup**: Get definitions, examples, and parts of speech automatically.
- **Contextual questions**: AI generates diverse, context-aware review questions.
- **Answer evaluation**: AI provides detailed feedback on your answers.

Without an API key, the app falls back to built-in question templates and a free dictionary API.

---

## API Endpoints

All endpoints return JSON and use standard HTTP status codes.

### Words

| Method   | Endpoint             | Description                    | Request Body                                                                       |
| -------- | -------------------- | ------------------------------ | ---------------------------------------------------------------------------------- |
| `GET`    | `/api/words`         | Fetch all words                | --                                                                                 |
| `POST`   | `/api/words`         | Add a new word                 | `{ word, definition, example, partOfSpeech }`                                      |
| `GET`    | `/api/words/[id]`    | Get a word by ID               | --                                                                                 |
| `PUT`    | `/api/words/[id]`    | Update a word (review data)    | `{ easeFactor, interval, repetitions, nextReviewDate, lastReviewDate }`            |
| `DELETE` | `/api/words/[id]`    | Delete a word                  | --                                                                                 |
| `POST`   | `/api/words/bulk`    | Bulk import words              | `{ words: [{ word, definition, example, partOfSpeech }, ...] }`                    |

#### Example: Add a word

```bash
curl -X POST http://localhost:3000/api/words \
  -H "Content-Type: application/json" \
  -d '{
    "word": "ephemeral",
    "definition": "lasting for a very short time",
    "example": "The ephemeral beauty of cherry blossoms.",
    "partOfSpeech": "adjective"
  }'
```

#### Example: Update after review

```bash
curl -X PUT http://localhost:3000/api/words/1709123456-abc123def \
  -H "Content-Type: application/json" \
  -d '{
    "easeFactor": 2.6,
    "interval": 6,
    "repetitions": 2,
    "nextReviewDate": "2026-03-11T00:00:00.000Z",
    "lastReviewDate": "2026-03-05T10:30:00.000Z"
  }'
```

### Statistics

| Method | Endpoint      | Description          | Request Body                                                           |
| ------ | ------------- | -------------------- | ---------------------------------------------------------------------- |
| `GET`  | `/api/stats`  | Fetch learning stats | --                                                                     |
| `PUT`  | `/api/stats`  | Update stats         | `{ totalWords, wordsLearned, currentStreak, longestStreak, lastStudyDate }` |

#### Example: Get stats

```bash
curl http://localhost:3000/api/stats
```

Response:

```json
{
  "id": 1,
  "totalWords": 42,
  "wordsLearned": 15,
  "currentStreak": 7,
  "longestStreak": 14,
  "lastStudyDate": "2026-03-05T10:30:00.000Z"
}
```

---

## Database

### Schema

**`words` table**

| Column             | Type                     | Default     | Description                  |
| ------------------ | ------------------------ | ----------- | ---------------------------- |
| `id`               | TEXT (PK)                | --          | Unique identifier            |
| `word`             | TEXT                     | --          | The vocabulary word          |
| `definition`       | TEXT                     | --          | Word definition              |
| `example`          | TEXT                     | `''`        | Example sentence             |
| `part_of_speech`   | TEXT                     | `'noun'`    | Part of speech               |
| `ease_factor`      | REAL                     | `2.5`       | SM-2 ease factor             |
| `interval`         | INTEGER                  | `0`         | Days until next review       |
| `repetitions`      | INTEGER                  | `0`         | Successful review count      |
| `next_review_date` | TIMESTAMP WITH TIME ZONE | --          | Next scheduled review        |
| `last_review_date` | TIMESTAMP WITH TIME ZONE | `NULL`      | Last review timestamp        |
| `created_at`       | TIMESTAMP WITH TIME ZONE | `NOW()`     | Word creation timestamp      |

**`stats` table** (singleton row, `id = 1`)

| Column           | Type                     | Default | Description              |
| ---------------- | ------------------------ | ------- | ------------------------ |
| `id`             | INTEGER (PK)             | `1`     | Always 1 (singleton)     |
| `total_words`    | INTEGER                  | `0`     | Total vocabulary count   |
| `words_learned`  | INTEGER                  | `0`     | Words with mastery >= 80%|
| `current_streak` | INTEGER                  | `0`     | Current study streak     |
| `longest_streak` | INTEGER                  | `0`     | Best streak achieved     |
| `last_study_date`| TIMESTAMP WITH TIME ZONE | `NULL`  | Last study session date  |

**Indexes**: `idx_words_next_review`, `idx_words_word`, `idx_words_created_at`

### Supported Databases

VocabMaster uses a **factory pattern** for database abstraction (`lib/db/index.ts`), making it easy to switch between backends:

| Database   | Best For           | Config Value   |
| ---------- | ------------------ | -------------- |
| Supabase   | Vercel deployment  | `supabase`     |
| PostgreSQL | Production Docker  | `postgresql`   |
| MySQL      | Existing MySQL infra| `mysql`        |
| SQLite     | Local dev / simple | `sqlite`       |

---

## Deployment

### Vercel + Supabase (Recommended)

1. **Create a Supabase project** at [supabase.com](https://supabase.com)

2. **Run the database migration**:
   ```bash
   npm install -g supabase
   supabase login
   supabase link --project-ref <your-project-ref>
   supabase db push
   ```

3. **Deploy to Vercel**:
   ```bash
   npm install -g vercel
   vercel login
   vercel link
   vercel --prod
   ```

4. **Set environment variables** in Vercel Dashboard > Project > Settings > Environment Variables:
   ```
   DATABASE_TYPE = supabase
   DATABASE_URL = postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

### Docker (Self-Hosted)

Use the interactive setup script:

```bash
bash setup.sh
```

Or start manually with Docker Compose:

```bash
# SQLite (default - no external database needed)
docker-compose up -d

# With PostgreSQL
docker-compose --profile postgres up -d

# With MySQL
docker-compose --profile mysql up -d

# All databases (for testing)
docker-compose --profile all up -d
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### CI/CD with GitHub Actions

Three workflows are included:

| Workflow       | File                  | Trigger                              | Purpose                              |
| -------------- | --------------------- | ------------------------------------ | ------------------------------------ |
| **CI**         | `ci.yml`              | Push to `main`/`develop`, PRs       | Lint, type check, build verification |
| **CD**         | `cd.yml`              | Push to `main`, PRs to `main`       | Preview deploys (PRs), production    |
| **Deploy**     | `deploy.yml`          | Push to `main` (db changes), manual | Supabase migrations + Vercel deploy  |

**Required GitHub Secrets:**

| Secret                   | Source                                     |
| ------------------------ | ------------------------------------------ |
| `VERCEL_TOKEN`           | [Vercel Tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID`          | `.vercel/project.json` after `vercel link` |
| `VERCEL_PROJECT_ID`      | `.vercel/project.json` after `vercel link` |
| `SUPABASE_ACCESS_TOKEN`  | [Supabase Tokens](https://supabase.com/dashboard/account/tokens) |
| `SUPABASE_PROJECT_ID`    | Supabase Dashboard > Project Settings      |
| `SUPABASE_DB_PASSWORD`   | Supabase Dashboard > Database Settings     |

See [`.github/DEPLOYMENT.md`](.github/DEPLOYMENT.md) for the full CI/CD setup guide.

---

## Development

```bash
# Start development server
npm run dev

# Run linter
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

### Scripts

| Script                           | Description                       |
| -------------------------------- | --------------------------------- |
| `scripts/setup-cicd.sh`         | Automate CI/CD setup              |
| `scripts/verify-pipeline.sh`    | Verify pipeline configuration     |
| `scripts/dry-run-pipeline.sh`   | Test pipeline without deploying   |

---

## License

This project is private and not licensed for public distribution.
