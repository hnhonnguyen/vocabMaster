# Architecture & Design

<cite>
**Referenced Files in This Document**
- [app/layout.tsx](file://app/layout.tsx)
- [app/page.tsx](file://app/page.tsx)
- [app/api/stats/route.ts](file://app/api/stats/route.ts)
- [app/api/words/route.ts](file://app/api/words/route.ts)
- [app/api/words/[id]/route.ts](file://app/api/words/[id]/route.ts)
- [app/api/words/bulk/route.ts](file://app/api/words/bulk/route.ts)
- [lib/db/index.ts](file://lib/db/index.ts)
- [lib/db/types.ts](file://lib/db/types.ts)
- [lib/db/sqlite.ts](file://lib/db/sqlite.ts)
- [lib/storage.ts](file://lib/storage.ts)
- [lib/spaced-repetition.ts](file://lib/spaced-repetition.ts)
- [lib/dictionary-service.ts](file://lib/dictionary-service.ts)
- [lib/types.ts](file://lib/types.ts)
- [next.config.mjs](file://next.config.mjs)
- [package.json](file://package.json)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)
10. [Appendices](#appendices)

## Introduction
This document describes the system architecture of VocabMaster, focusing on its layered design, Next.js 14 Pages Router usage, API routes, component hierarchy, database abstraction, and service architecture. It explains how the presentation layer (UI), business logic (spaced repetition, dictionary services), and data access layer (SQLite via a database abstraction) collaborate. It also covers system boundaries, data flows, separation of concerns, scalability considerations, performance optimizations, and extensibility points.

## Project Structure
VocabMaster follows a conventional Next.js 14 app directory structure with:
- app: Next.js Pages Router entry points and API routes
- components: Reusable UI components
- lib: Business logic, services, and database abstraction
- data: Local SQLite database files

```mermaid
graph TB
subgraph "Next.js App"
LAYOUT["app/layout.tsx"]
PAGE["app/page.tsx"]
STATS_API["app/api/stats/route.ts"]
WORDS_API["app/api/words/route.ts"]
WORD_ID_API["app/api/words/[id]/route.ts"]
WORD_BULK_API["app/api/words/bulk/route.ts"]
end
subgraph "Lib Layer"
TYPES["lib/types.ts"]
STORAGE["lib/storage.ts"]
SPACED["lib/spaced-repetition.ts"]
DICT["lib/dictionary-service.ts"]
DB_IDX["lib/db/index.ts"]
DB_TYPES["lib/db/types.ts"]
SQLITE["lib/db/sqlite.ts"]
end
subgraph "Data"
DBFILE["data/vocab-master.db<br/>+shm +wal"]
end
PAGE --> STORAGE
PAGE --> SPACED
PAGE --> TYPES
STORAGE --> WORDS_API
STORAGE --> STATS_API
WORDS_API --> DB_IDX
WORD_ID_API --> DB_IDX
WORD_BULK_API --> DB_IDX
STATS_API --> DB_IDX
DB_IDX --> SQLITE
SQLITE --> DBFILE
```

**Diagram sources**
- [app/layout.tsx](file://app/layout.tsx#L1-L24)
- [app/page.tsx](file://app/page.tsx#L1-L316)
- [app/api/stats/route.ts](file://app/api/stats/route.ts#L1-L26)
- [app/api/words/route.ts](file://app/api/words/route.ts#L1-L28)
- [app/api/words/[id]/route.ts](file://app/api/words/[id]/route.ts#L1-L55)
- [app/api/words/bulk/route.ts](file://app/api/words/bulk/route.ts#L1-L19)
- [lib/db/index.ts](file://lib/db/index.ts#L1-L21)
- [lib/db/types.ts](file://lib/db/types.ts#L1-L35)
- [lib/db/sqlite.ts](file://lib/db/sqlite.ts#L1-L297)
- [lib/storage.ts](file://lib/storage.ts#L1-L137)
- [lib/spaced-repetition.ts](file://lib/spaced-repetition.ts#L1-L123)
- [lib/dictionary-service.ts](file://lib/dictionary-service.ts#L1-L255)
- [lib/types.ts](file://lib/types.ts#L1-L105)

**Section sources**
- [app/layout.tsx](file://app/layout.tsx#L1-L24)
- [app/page.tsx](file://app/page.tsx#L1-L316)
- [lib/types.ts](file://lib/types.ts#L1-L105)

## Core Components
- Presentation layer (UI):
  - Root layout and global styles
  - Page component orchestrating views and state
  - UI components for dialogs, lists, and dashboards
- Business logic:
  - Spaced repetition calculations and scheduling
  - Dictionary service with AI and fallback
  - Types and constants for domain model
- Data access:
  - Database abstraction interface
  - SQLite implementation with initialization, seeding, and transactions
  - Storage façade for API-driven client operations

Key responsibilities:
- app/page.tsx: Renders views, manages local state, delegates persistence to lib/storage.ts, and computes learning statistics via lib/spaced-repetition.ts.
- lib/storage.ts: Encapsulates HTTP calls to app/api/* routes, returning typed data to the UI.
- lib/db/*: Provides a singleton database accessor and an IDatabase interface for pluggable backends.
- lib/spaced-repetition.ts: Implements SM-2 scheduling and mastery metrics.
- lib/dictionary-service.ts: Integrates AI-powered lookups with a free dictionary fallback and robust import parsing.

**Section sources**
- [app/page.tsx](file://app/page.tsx#L1-L316)
- [lib/storage.ts](file://lib/storage.ts#L1-L137)
- [lib/db/index.ts](file://lib/db/index.ts#L1-L21)
- [lib/db/types.ts](file://lib/db/types.ts#L1-L35)
- [lib/db/sqlite.ts](file://lib/db/sqlite.ts#L1-L297)
- [lib/spaced-repetition.ts](file://lib/spaced-repetition.ts#L1-L123)
- [lib/dictionary-service.ts](file://lib/dictionary-service.ts#L1-L255)
- [lib/types.ts](file://lib/types.ts#L1-L105)

## Architecture Overview
VocabMaster employs a layered architecture:
- Presentation layer: Next.js app directory with page.tsx rendering UI and coordinating user actions.
- Business logic layer: TypeScript modules under lib/ implementing domain rules and integrations.
- Data access layer: Abstraction over SQLite with a factory and singleton pattern.

System boundaries:
- API boundary: app/api/* routes expose CRUD and stats endpoints.
- Persistence boundary: lib/db/* encapsulates schema, migrations, and queries.
- UI boundary: app/page.tsx and components/ui/* define the user interface.

```mermaid
graph TB
UI["app/page.tsx<br/>UI Views & State"]
COMP["Components<br/>ui/*, word-list, dashboard, etc."]
BUS["Business Logic<br/>lib/spaced-repetition.ts<br/>lib/dictionary-service.ts<br/>lib/types.ts"]
STORE["Storage Facade<br/>lib/storage.ts"]
API_STATS["API: GET/PUT /api/stats"]
API_WORDS["API: GET/POST/PUT/DELETE /api/words(/bulk)"]
DBFACT["DB Factory<br/>lib/db/index.ts"]
DBIF["IDatabase Interface<br/>lib/db/types.ts"]
SQLITE["SQLITE Implementation<br/>lib/db/sqlite.ts"]
FS["File System<br/>data/vocab-master.db (+shm/+wal)"]
UI --> COMP
UI --> STORE
UI --> BUS
STORE --> API_STATS
STORE --> API_WORDS
API_STATS --> DBFACT
API_WORDS --> DBFACT
DBFACT --> SQLITE
SQLITE --> DBIF
SQLITE --> FS
```

**Diagram sources**
- [app/page.tsx](file://app/page.tsx#L1-L316)
- [lib/storage.ts](file://lib/storage.ts#L1-L137)
- [app/api/stats/route.ts](file://app/api/stats/route.ts#L1-L26)
- [app/api/words/route.ts](file://app/api/words/route.ts#L1-L28)
- [app/api/words/[id]/route.ts](file://app/api/words/[id]/route.ts#L1-L55)
- [app/api/words/bulk/route.ts](file://app/api/words/bulk/route.ts#L1-L19)
- [lib/db/index.ts](file://lib/db/index.ts#L1-L21)
- [lib/db/types.ts](file://lib/db/types.ts#L1-L35)
- [lib/db/sqlite.ts](file://lib/db/sqlite.ts#L1-L297)

## Detailed Component Analysis

### Presentation Layer: Next.js Pages Router and Component Hierarchy
- app/layout.tsx: Sets global metadata and font, wraps children in HTML structure.
- app/page.tsx: Client component managing:
  - View state (dashboard, words, learning, complete)
  - Local word list and stats
  - Dialog orchestration (add word, bulk import, settings)
  - Lifecycle data loading via lib/storage.loadDataAsync
  - Learning mode transitions and session completion handling
  - Navigation and action buttons

Component hierarchy:
- Header and navigation rendered conditionally based on view
- Conditional rendering of Dashboard, WordList, LearningMode, SessionComplete
- Floating action button for mobile
- Modal dialogs for add/import/settings

```mermaid
sequenceDiagram
participant U as "User"
participant P as "app/page.tsx"
participant S as "lib/storage.ts"
participant A as "API Routes"
participant D as "lib/db/index.ts"
participant Q as "lib/db/sqlite.ts"
U->>P : "Open app"
P->>S : "loadDataAsync()"
S->>A : "GET /api/words"
A->>D : "getDatabase()"
D->>Q : "SQLITE.getAllWords()"
Q-->>A : "words[]"
A-->>S : "{ words }"
S->>A : "GET /api/stats"
A->>D : "getDatabase()"
D->>Q : "SQLITE.getStats()"
Q-->>A : "{ stats }"
A-->>S : "{ stats }"
S-->>P : "{ words, stats }"
P->>P : "Set state, render views"
```

**Diagram sources**
- [app/page.tsx](file://app/page.tsx#L1-L316)
- [lib/storage.ts](file://lib/storage.ts#L77-L84)
- [app/api/words/route.ts](file://app/api/words/route.ts#L1-L28)
- [app/api/stats/route.ts](file://app/api/stats/route.ts#L1-L26)
- [lib/db/index.ts](file://lib/db/index.ts#L12-L18)
- [lib/db/sqlite.ts](file://lib/db/sqlite.ts#L130-L138)

**Section sources**
- [app/layout.tsx](file://app/layout.tsx#L1-L24)
- [app/page.tsx](file://app/page.tsx#L1-L316)

### Business Logic Layer: Spaced Repetition and Dictionary Services
- Spaced repetition:
  - SM-2 scheduling with ease factor, interval, repetitions, and next review date
  - Mastery calculation and prioritization of due words
  - Utility ID generation for new words
- Dictionary service:
  - AI-powered lookup with fallback to free dictionary API
  - Robust parsing for CSV, JSON, and simple text import formats

```mermaid
flowchart TD
Start(["Start Learning Session"]) --> FetchDue["Filter due words<br/>getWordsForReview()"]
FetchDue --> HasDue{"Any due words?"}
HasDue --> |No| EndEmpty["No session data"]
HasDue --> |Yes| Render["Render LearningMode with subset"]
Render --> Answer["User answers"]
Answer --> UpdateSR["calculateNextReview()<br/>update ease/int/rep/nextReviewDate"]
UpdateSR --> Persist["Persist word updates via API"]
Persist --> End(["Session step complete"])
```

**Diagram sources**
- [lib/spaced-repetition.ts](file://lib/spaced-repetition.ts#L50-L68)
- [lib/spaced-repetition.ts](file://lib/spaced-repetition.ts#L8-L48)
- [lib/storage.ts](file://lib/storage.ts#L41-L53)

**Section sources**
- [lib/spaced-repetition.ts](file://lib/spaced-repetition.ts#L1-L123)
- [lib/dictionary-service.ts](file://lib/dictionary-service.ts#L1-L255)
- [lib/types.ts](file://lib/types.ts#L1-L105)

### Data Access Layer: Database Abstraction and SQLite Implementation
- Abstraction:
  - IDatabase interface defines methods for words and stats
  - Factory function getDatabase() returns a singleton implementation
- SQLite implementation:
  - Initializes schema, indexes, seeds sample words, and synchronizes stats
  - Uses WAL mode and foreign keys enabled
  - Transactions for bulk inserts
  - Row mapping helpers

```mermaid
classDiagram
class IDatabase {
+initialize() void
+getAllWords() VocabWord[]
+getWordById(id) VocabWord|null
+addWord(word) VocabWord
+addWords(words) VocabWord[]
+updateWord(id, updates) VocabWord|null
+deleteWord(id) boolean
+getStats() UserStats
+updateStats(updates) UserStats
+resetAll() void
}
class SQLiteDatabase {
-db Database
+initialize() void
+getAllWords() VocabWord[]
+getWordById(id) VocabWord|null
+addWord(word) VocabWord
+addWords(words) VocabWord[]
+updateWord(id, updates) VocabWord|null
+deleteWord(id) boolean
+getStats() UserStats
+updateStats(updates) UserStats
+resetAll() void
}
IDatabase <|.. SQLiteDatabase : "implements"
```

**Diagram sources**
- [lib/db/types.ts](file://lib/db/types.ts#L16-L34)
- [lib/db/sqlite.ts](file://lib/db/sqlite.ts#L28-L279)

**Section sources**
- [lib/db/index.ts](file://lib/db/index.ts#L1-L21)
- [lib/db/types.ts](file://lib/db/types.ts#L1-L35)
- [lib/db/sqlite.ts](file://lib/db/sqlite.ts#L1-L297)

### API Routes: Next.js App Router Endpoints
- GET /api/words: Returns all words
- POST /api/words: Creates a single word
- GET /api/words/[id]: Retrieves a word by ID
- PUT /api/words/[id]: Updates a word
- DELETE /api/words/[id]: Deletes a word
- POST /api/words/bulk: Bulk inserts words
- GET /api/stats: Retrieves user stats
- PUT /api/stats: Updates user stats

```mermaid
sequenceDiagram
participant C as "Client (lib/storage.ts)"
participant R as "Route Handler"
participant F as "getDatabase()"
participant S as "SQLITE"
C->>R : "POST /api/words"
R->>F : "getDatabase()"
F-->>R : "SQLITE instance"
R->>S : "addWord(payload)"
S-->>R : "VocabWord"
R-->>C : "{ word } 201"
```

**Diagram sources**
- [app/api/words/route.ts](file://app/api/words/route.ts#L16-L27)
- [lib/db/index.ts](file://lib/db/index.ts#L12-L18)
- [lib/db/sqlite.ts](file://lib/db/sqlite.ts#L140-L159)

**Section sources**
- [app/api/words/route.ts](file://app/api/words/route.ts#L1-L28)
- [app/api/words/[id]/route.ts](file://app/api/words/[id]/route.ts#L1-L55)
- [app/api/words/bulk/route.ts](file://app/api/words/bulk/route.ts#L1-L19)
- [app/api/stats/route.ts](file://app/api/stats/route.ts#L1-L26)

## Dependency Analysis
- Next.js configuration excludes better-sqlite3 from client bundling; it runs server-side in API routes.
- Runtime dependencies include Next.js, React, Tailwind UI primitives, and better-sqlite3 for server-side DB access.
- Internal dependencies:
  - app/page.tsx depends on lib/storage.ts, lib/spaced-repetition.ts, and lib/types.ts
  - lib/storage.ts depends on app/api/* routes
  - API routes depend on lib/db/index.ts and lib/db/sqlite.ts
  - lib/db/index.ts depends on lib/db/sqlite.ts and exposes IDatabase

```mermaid
graph LR
NEXT["next.config.mjs<br/>webpack externals"] --> SQLITE3["better-sqlite3"]
PKG["package.json<br/>dependencies"] --> NEXT
PKG --> SQLITE3
PAGE["app/page.tsx"] --> STORAGE["lib/storage.ts"]
PAGE --> SPACED["lib/spaced-repetition.ts"]
PAGE --> TYPES["lib/types.ts"]
STORAGE --> WORDS_ROUTE["app/api/words/route.ts"]
STORAGE --> STATS_ROUTE["app/api/stats/route.ts"]
WORDS_ROUTE --> DBIDX["lib/db/index.ts"]
STATS_ROUTE --> DBIDX
DBIDX --> SQLITE["lib/db/sqlite.ts"]
```

**Diagram sources**
- [next.config.mjs](file://next.config.mjs#L1-L15)
- [package.json](file://package.json#L11-L21)
- [app/page.tsx](file://app/page.tsx#L1-L316)
- [lib/storage.ts](file://lib/storage.ts#L1-L137)
- [app/api/words/route.ts](file://app/api/words/route.ts#L1-L28)
- [app/api/stats/route.ts](file://app/api/stats/route.ts#L1-L26)
- [lib/db/index.ts](file://lib/db/index.ts#L1-L21)
- [lib/db/sqlite.ts](file://lib/db/sqlite.ts#L1-L297)

**Section sources**
- [next.config.mjs](file://next.config.mjs#L1-L15)
- [package.json](file://package.json#L11-L21)

## Performance Considerations
- Database:
  - WAL mode improves concurrency and read throughput.
  - Indexes on next_review_date and word support efficient filtering and sorting.
  - Transactions for bulk inserts reduce overhead.
- API:
  - Single-page app reduces round trips; initial load uses concurrent fetches for words and stats.
- UI:
  - Client-side sorting and filtering for due words avoids frequent server calls.
- Scalability:
  - Current SQLite setup is file-based and suitable for single-instance deployments.
  - The IDatabase abstraction enables migration to cloud databases (e.g., MySQL/PostgreSQL) by swapping implementations.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
- API errors:
  - API routes return structured error messages; check status codes and bodies for failures during CRUD or stats operations.
- Database initialization:
  - On first run, schema is created and sample words seeded; verify data directory existence and permissions.
- Client-side state:
  - If UI does not reflect updates, confirm that lib/storage.ts fetches succeed and that app/page.tsx state updates are triggered.

**Section sources**
- [app/api/words/route.ts](file://app/api/words/route.ts#L10-L13)
- [app/api/stats/route.ts](file://app/api/stats/route.ts#L10-L12)
- [lib/db/sqlite.ts](file://lib/db/sqlite.ts#L35-L81)
- [lib/storage.ts](file://lib/storage.ts#L5-L17)

## Conclusion
VocabMaster’s architecture cleanly separates presentation, business logic, and data access layers. The Next.js Pages Router integrates seamlessly with API routes, while a database abstraction enables future backend swaps. The spaced repetition engine and dictionary service provide rich learning features. With WAL mode, indexes, and transactions, the system balances simplicity and performance for a single-user learning application.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### System Boundaries and Data Flow Summary
- Presentation boundary: app/page.tsx renders views and triggers actions.
- Business boundary: lib/spaced-repetition.ts and lib/dictionary-service.ts encapsulate domain logic.
- Data boundary: lib/db/* abstracts persistence; app/api/* bridge to the database.
- Data flow: UI -> Storage facade -> API routes -> Database implementation -> File system.

[No sources needed since this section provides a summary]