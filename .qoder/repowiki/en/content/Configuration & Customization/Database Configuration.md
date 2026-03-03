# Database Configuration

<cite>
**Referenced Files in This Document**
- [index.ts](file://lib/db/index.ts)
- [supabase.ts](file://lib/db/supabase.ts)
- [sqlite.ts](file://lib/db/sqlite.ts)
- [postgresql.ts](file://lib/db/postgresql.ts)
- [mysql.ts](file://lib/db/mysql.ts)
- [types.ts](file://lib/db/types.ts)
- [types.ts](file://lib/types.ts)
- [route.ts](file://app/api/stats/route.ts)
- [settings-dialog.tsx](file://components/settings-dialog.tsx)
- [docker-compose.yml](file://docker-compose.yml)
- [DOCKER.md](file://DOCKER.md)
- [init.sql](file://init/postgres/init.sql)
- [init.sql](file://init/mysql/init.sql)
- [.env](file://.env)
- [.env.example](file://.env.example)
- [vercel.json](file://vercel.json)
- [001_initial_schema.sql](file://supabase/migrations/001_initial_schema.sql)
- [seed.sql](file://supabase/seed.sql)
- [config.toml](file://supabase/config.toml)
</cite>

## Update Summary
**Changes Made**
- Added comprehensive documentation for Supabase backend support with dedicated SSL configuration
- Updated database factory architecture to include 'supabase' as default deployment option
- Documented Vercel-specific environment configuration for Supabase deployments
- Added Supabase-specific connection pooling and SSL settings
- Updated environment variable documentation to reflect Supabase deployment patterns
- Enhanced deployment guidance for serverless environments with connection pooling

## Table of Contents
1. [Introduction](#introduction)
2. [Multi-Database Architecture](#multi-database-architecture)
3. [Project Structure](#project-structure)
4. [Core Components](#core-components)
5. [Architecture Overview](#architecture-overview)
6. [Detailed Component Analysis](#detailed-component-analysis)
7. [Database Type Configurations](#database-type-configurations)
8. [Dependency Analysis](#dependency-analysis)
9. [Performance Considerations](#performance-considerations)
10. [Backup and Migration Procedures](#backup-and-migration-procedures)
11. [Database Security Considerations](#database-security-considerations)
12. [Troubleshooting Guide](#troubleshooting-guide)
13. [Conclusion](#conclusion)

## Introduction
This document provides comprehensive database configuration guidance for VocabMaster, covering all four supported database backends: SQLite (default for local development), PostgreSQL, MySQL, and Supabase (default for Vercel deployments). The application features a flexible database factory that dynamically selects the appropriate implementation based on environment variables, enabling seamless switching between different database systems. This documentation covers database setup, connection parameters, schema structure, indexing strategies, performance tuning, backup and migration procedures, file management, security considerations, and troubleshooting steps for connectivity issues across all supported database types.

**Updated** Added Supabase backend support with SSL configuration for secure cloud deployments

## Multi-Database Architecture
VocabMaster implements a flexible database abstraction layer that supports four distinct database backends through a unified interface. The architecture enables dynamic selection of database implementations at runtime based on the DATABASE_TYPE environment variable, with Supabase as the default for Vercel deployments.

```mermaid
graph TB
subgraph "Application Layer"
API["API Endpoint<br/>GET/PUT /api/stats"]
UI["Settings Dialog<br/>Connection Test"]
Factory["Database Factory<br/>getDatabase()"]
Interface["IDatabase Interface<br/>Unified API"]
end
subgraph "Database Implementations"
SQLite["SQLiteDatabase<br/>SQLite Adapter"]
PostgreSQL["PostgreSQlDatabase<br/>PostgreSQL Adapter"]
MySQL["MySQLDatabase<br/>MySQL Adapter"]
Supabase["SupabaseDatabase<br/>Supabase Adapter"]
end
subgraph "External Services"
SQLiteFile["SQLite File<br/>vocab-master.db"]
PostgreSQLService["PostgreSQL Service<br/>postgres:5432"]
MySQLService["MySQL Service<br/>mysql:3306"]
SupabaseCloud["Supabase Cloud<br/>pgbouncer:6543"]
end
API --> Factory
UI --> Factory
Factory --> Interface
Interface --> SQLite
Interface --> PostgreSQL
Interface --> MySQL
Interface --> Supabase
SQLite --> SQLiteFile
PostgreSQL --> PostgreSQLService
MySQL --> MySQLService
Supabase --> SupabaseCloud
```

**Diagram sources**
- [index.ts](file://lib/db/index.ts#L1-L83)
- [types.ts](file://lib/db/types.ts#L1-L35)
- [supabase.ts](file://lib/db/supabase.ts#L1-L378)
- [sqlite.ts](file://lib/db/sqlite.ts#L28-L33)
- [postgresql.ts](file://lib/db/postgresql.ts#L7-L28)
- [mysql.ts](file://lib/db/mysql.ts#L7-L32)

**Section sources**
- [index.ts](file://lib/db/index.ts#L1-L83)
- [types.ts](file://lib/db/types.ts#L1-L35)

## Project Structure
The database configuration spans multiple layers with clear separation of concerns, now including Supabase backend support:

- **Database Factory**: Centralized singleton that selects and initializes the appropriate database implementation with Supabase as default
- **Database Adapters**: Separate implementations for each database backend with consistent APIs
- **Schema Definitions**: Database-specific initialization scripts for PostgreSQL, MySQL, and Supabase
- **Docker Configuration**: Multi-service setup supporting all database types
- **Vercel Configuration**: Serverless deployment defaults for Supabase integration

```mermaid
graph TB
subgraph "Database Layer"
Factory["lib/db/index.ts<br/>Dynamic Factory"]
Types["lib/db/types.ts<br/>IDatabase Interface"]
SQLite["lib/db/sqlite.ts<br/>SQLite Implementation"]
PostgreSQL["lib/db/postgresql.ts<br/>PostgreSQL Implementation"]
MySQL["lib/db/mysql.ts<br/>MySQL Implementation"]
Supabase["lib/db/supabase.ts<br/>Supabase Implementation"]
end
subgraph "Schema Layer"
SQLiteSchema["lib/db/sqlite.ts<br/>SQLite Schema"]
PostgreSQLSchema["init/postgres/init.sql<br/>PostgreSQL Schema"]
MySQLSchema["init/mysql/init.sql<br/>MySQL Schema"]
SupabaseSchema["supabase/migrations/001_initial_schema.sql<br/>Supabase Schema"]
end
subgraph "Configuration Layer"
Env["lib/db/index.ts<br/>Environment Detection"]
Docker["docker-compose.yml<br/>Service Configuration"]
EnvFile[".env<br/>Environment Variables"]
Vercel["vercel.json<br/>Serverless Defaults"]
SupabaseConfig["supabase/config.toml<br/>Local Development"]
end
Factory --> Types
Factory --> SQLite
Factory --> PostgreSQL
Factory --> MySQL
Factory --> Supabase
SQLite --> SQLiteSchema
PostgreSQL --> PostgreSQLSchema
MySQL --> MySQLSchema
Supabase --> SupabaseSchema
Env --> Factory
Docker --> Factory
EnvFile --> Factory
Vercel --> Factory
SupabaseConfig --> Supabase
```

**Diagram sources**
- [index.ts](file://lib/db/index.ts#L1-L83)
- [types.ts](file://lib/db/types.ts#L1-L35)
- [supabase.ts](file://lib/db/supabase.ts#L1-L378)
- [sqlite.ts](file://lib/db/sqlite.ts#L1-L297)
- [postgresql.ts](file://lib/db/postgresql.ts#L1-L371)
- [mysql.ts](file://lib/db/mysql.ts#L1-L375)
- [docker-compose.yml](file://docker-compose.yml#L1-L135)
- [vercel.json](file://vercel.json#L1-L39)
- [config.toml](file://supabase/config.toml#L1-L68)

**Section sources**
- [index.ts](file://lib/db/index.ts#L1-L83)
- [docker-compose.yml](file://docker-compose.yml#L1-L135)
- [vercel.json](file://vercel.json#L1-L39)

## Core Components

### Database Factory and Dynamic Selection
The database factory serves as the central hub for database initialization and selection, now supporting Supabase as the default option for Vercel deployments. It reads the DATABASE_TYPE environment variable and instantiates the appropriate database implementation.

Key responsibilities:
- Environment-driven database selection with Supabase as default
- Singleton pattern implementation with lazy initialization
- Error handling and graceful fallback mechanisms
- Support for serverless deployment patterns

**Updated** Enhanced factory to prioritize Supabase for Vercel deployments with automatic SSL configuration

### Database Interface (IDatabase)
A unified interface that defines all database operations, enabling seamless switching between different database backends while maintaining consistent application logic.

Supported operations:
- CRUD operations for vocabulary words
- Statistics management
- Connection lifecycle management
- Data synchronization utilities

### Database Implementations
Each database backend implements the IDatabase interface with database-specific optimizations and features:

- **SQLite**: File-based embedded database with WAL mode
- **PostgreSQL**: Advanced RDBMS with connection pooling and SSL support
- **MySQL**: Reliable open-source database with connection pooling
- **Supabase**: Cloud-native PostgreSQL with serverless-optimized connection pooling and SSL configuration

**Section sources**
- [index.ts](file://lib/db/index.ts#L10-L83)
- [types.ts](file://lib/db/types.ts#L12-L34)

## Architecture Overview
The multi-database architecture follows a layered approach with clear separation between the application layer, database abstraction, and concrete implementations, now optimized for serverless deployments.

```mermaid
sequenceDiagram
participant Client as "Client"
participant API as "Stats API"
participant Factory as "Database Factory"
participant Impl as "Database Implementation"
participant DB as "Database Engine"
Client->>API : "GET /api/stats"
API->>Factory : "getDatabase()"
Factory->>Factory : "Check DATABASE_TYPE env"
alt Supabase Deployment
Factory->>Impl : "Instantiate SupabaseDatabase"
Impl->>Impl : "Initialize with SSL pool"
else Other Database Types
Factory->>Impl : "Instantiate selected impl"
Impl->>Impl : "initialize()"
end
Impl->>DB : "Connect to database"
DB-->>Impl : "Connection established"
Impl-->>Factory : "Initialization complete"
Factory-->>API : "Database instance"
API->>Impl : "getStats()"
Impl->>DB : "Execute query"
DB-->>Impl : "Stats data"
Impl-->>API : "UserStats"
API-->>Client : "JSON response"
```

**Diagram sources**
- [route.ts](file://app/api/stats/route.ts#L1-L25)
- [index.ts](file://lib/db/index.ts#L15-L83)
- [supabase.ts](file://lib/db/supabase.ts#L37-L72)
- [postgresql.ts](file://lib/db/postgresql.ts#L30-L57)
- [mysql.ts](file://lib/db/mysql.ts#L34-L61)

## Detailed Component Analysis

### Database Factory and Dynamic Initialization
The factory implements a sophisticated initialization mechanism that handles environment detection, lazy loading, and error recovery, with Supabase as the default for serverless environments.

```mermaid
flowchart TD
Start(["Call getDatabase()"]) --> Check{"Instance exists?"}
Check --> |Yes| ReturnInst["Return existing instance"]
Check --> |No| InitFlag["Set initializing flag"]
InitFlag --> EnvCheck{"DATABASE_TYPE env"}
EnvCheck --> |supabase| NewSupabase["Create SupabaseDatabase<br/>SSL-enabled pool"]
EnvCheck --> |postgresql| NewPG["Create PostgreSQlDatabase"]
EnvCheck --> |mysql| NewMySQL["Create MySQLDatabase"]
EnvCheck --> |sqlite| NewSQLite["Create SQLiteDatabase"]
EnvCheck --> |default| NewSupabase
NewSupabase --> InitSupabase["Initialize Supabase with SSL pool"]
NewPG --> InitPG["Initialize PostgreSQL"]
NewMySQL --> InitMySQL["Initialize MySQL"]
NewSQLite --> InitSQLite["Initialize SQLite"]
InitSupabase --> Success["Return instance"]
InitPG --> Success
InitMySQL --> Success
InitSQLite --> Success
Success --> ClearFlag["Clear initializing flag"]
```

**Updated** Added Supabase initialization path with SSL configuration for cloud deployments

**Diagram sources**
- [index.ts](file://lib/db/index.ts#L15-L83)

**Section sources**
- [index.ts](file://lib/db/index.ts#L15-L83)

### Supabase Implementation Details
The Supabase implementation provides a cloud-native database solution optimized for serverless deployments with connection pooling and SSL configuration.

Key features:
- Global connection pool for serverless invocation reuse
- SSL configuration with rejectUnauthorized: false for Supabase compatibility
- Serverless-optimized pool size (max: 5 connections)
- Automatic stats row initialization and sample data seeding
- Transaction management for bulk operations

**New Section** Added comprehensive Supabase backend documentation

**Section sources**
- [supabase.ts](file://lib/db/supabase.ts#L1-L378)

### SQLite Implementation Details
The SQLite implementation provides a file-based embedded database solution perfect for development and small-scale deployments.

Key features:
- Automatic database file creation in data directory
- WAL mode for improved concurrency
- Foreign key enforcement
- Automatic schema initialization

**Section sources**
- [sqlite.ts](file://lib/db/sqlite.ts#L8-L26)
- [sqlite.ts](file://lib/db/sqlite.ts#L35-L81)

### PostgreSQL Implementation Details
The PostgreSQL implementation offers enterprise-grade features with connection pooling and advanced database capabilities, including SSL support for production environments.

Key features:
- Connection pooling with configurable limits
- SSL configuration detection for production/Supabase environments
- Transaction management
- Advanced indexing support
- Timezone-aware timestamp handling

**Section sources**
- [postgresql.ts](file://lib/db/postgresql.ts#L11-L28)
- [postgresql.ts](file://lib/db/postgresql.ts#L30-L57)

### MySQL Implementation Details
The MySQL implementation provides reliable performance with connection pooling and MySQL-specific optimizations.

Key features:
- Connection pooling with timeout configuration
- UTF8MB4 character set support
- Transaction management
- Efficient bulk operations

**Section sources**
- [mysql.ts](file://lib/db/mysql.ts#L11-L32)
- [mysql.ts](file://lib/db/mysql.ts#L34-L61)

## Database Type Configurations

### Environment Variable Configuration
The application uses a unified environment variable system for configuring all database types, with enhanced support for Supabase deployments:

#### Basic Configuration
```bash
# Database Type Selection (now includes supabase)
DATABASE_TYPE=supabase  # Options: sqlite, postgresql, mysql, supabase

# Connection URLs (one of these based on DATABASE_TYPE)
DATABASE_URL=file:./data/vocab-master.db        # SQLite
DATABASE_URL=postgresql://user:pass@host:5432/db # PostgreSQL  
DATABASE_URL=mysql://user:pass@host:3306/db      # MySQL
DATABASE_URL=postgresql://user:pass@host:6543/db # Supabase (with pgbouncer)
```

#### Database-Specific Environment Variables
```bash
# Supabase Configuration (Vercel default)
DATABASE_TYPE=supabase
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true

# PostgreSQL Configuration
POSTGRES_DB=vocabmaster
POSTGRES_USER=vocabuser
POSTGRES_PASSWORD=vocabbuddy2024
POSTGRES_PORT=5432

# MySQL Configuration  
MYSQL_DB=vocabmaster
MYSQL_USER=vocabuser
MYSQL_PASSWORD=vocabbuddy2024
MYSQL_ROOT_PASSWORD=rootpassword
MYSQL_PORT=3306
```

**Updated** Added Supabase-specific environment variables and connection string format

**Section sources**
- [.env](file://.env#L6-L40)
- [.env.example](file://.env.example#L6-L61)

### Vercel Deployment Configuration
Vercel-specific configuration automatically sets Supabase as the default database type for serverless deployments:

```json
{
  "env": {
    "DATABASE_TYPE": "supabase"
  }
}
```

**New Section** Added Vercel-specific deployment configuration

**Section sources**
- [vercel.json](file://vercel.json#L13-L15)

### Docker Compose Multi-Service Setup
The Docker Compose configuration supports all four database types through service profiles:

```mermaid
graph TB
subgraph "Docker Services"
App["app:3000<br/>Application Container"]
Postgres["postgres:5432<br/>PostgreSQL Service"]
MySQL["mysql:3306<br/>MySQL Service"]
SQLPad["sqlpad:3000<br/>Database Management"]
SupabaseLocal["supabase:54322<br/>Local Supabase"]
end
subgraph "Profiles"
Default["default<br/>SQLite only"]
PostgresProfile["postgres<br/>PostgreSQL service"]
MySQLProfile["mysql<br/>MySQL service"]
SupabaseProfile["supabase<br/>Local Supabase"]
end
App --> Postgres
App --> MySQL
App --> SupabaseLocal
PostgresProfile --> Postgres
MySQLProfile --> MySQL
SupabaseProfile --> SupabaseLocal
Default --> App
```

**Updated** Added Supabase local development service configuration

**Diagram sources**
- [docker-compose.yml](file://docker-compose.yml#L1-L135)

**Section sources**
- [docker-compose.yml](file://docker-compose.yml#L1-L135)
- [DOCKER.md](file://DOCKER.md#L40-L110)

### Schema Structure and Relationships
All database implementations share identical schema definitions with database-specific optimizations:

#### Shared Tables Structure
```mermaid
erDiagram
WORDS {
varchar id PK
varchar word
text definition
text example
varchar part_of_speech
float ease_factor
int interval
int repetitions
timestamp next_review_date
timestamp last_review_date
timestamp created_at
}
STATS {
int id PK
int total_words
int words_learned
int current_streak
int longest_streak
timestamp last_study_date
}
WORDS ||--o{ STATS : "referenced by totals"
```

**Diagram sources**
- [init.sql](file://init/postgres/init.sql#L4-L27)
- [init.sql](file://init/mysql/init.sql#L4-L27)
- [001_initial_schema.sql](file://supabase/migrations/001_initial_schema.sql#L4-L27)

**Section sources**
- [init.sql](file://init/postgres/init.sql#L4-L42)
- [init.sql](file://init/mysql/init.sql#L4-L40)
- [001_initial_schema.sql](file://supabase/migrations/001_initial_schema.sql#L4-L48)

### Indexing Strategies
Each database implementation optimizes indexing for its specific capabilities:

#### PostgreSQL Indexes
- `idx_words_next_review`: Optimizes spaced repetition queries
- `idx_words_word`: Accelerates word lookups
- `idx_words_created_at`: Supports chronological ordering

#### MySQL Indexes  
- `idx_words_next_review`: Spaced repetition optimization
- `idx_words_word`: Word search acceleration
- `idx_words_created_at`: Creation time ordering

#### SQLite Indexes
- `idx_words_next_review`: WAL-optimized queries
- `idx_words_word`: Text search optimization

#### Supabase Indexes
- `idx_words_next_review`: Serverless-optimized queries
- `idx_words_word`: Text search acceleration
- `idx_words_created_at`: Creation time ordering

**Updated** Added Supabase-specific indexing strategies

**Section sources**
- [init.sql](file://init/postgres/init.sql#L29-L32)
- [init.sql](file://init/mysql/init.sql#L29-L32)
- [sqlite.ts](file://lib/db/sqlite.ts#L61-L63)
- [001_initial_schema.sql](file://supabase/migrations/001_initial_schema.sql#L29-L32)

## Dependency Analysis
The database layer has minimal external dependencies with clear separation between database implementations, now including Supabase-specific dependencies:

```mermaid
graph LR
Factory["lib/db/index.ts"] --> Interface["lib/db/types.ts"]
Factory --> SQLite["lib/db/sqlite.ts"]
Factory --> PostgreSQL["lib/db/postgresql.ts"]
Factory --> MySQL["lib/db/mysql.ts"]
Factory --> Supabase["lib/db/supabase.ts"]
SQLite --> BetterSQLite["better-sqlite3 (external)"]
PostgreSQL --> PG["pg (external)"]
MySQL --> MySQL2["mysql2 (external)"]
Supabase --> PG["pg (external)<br/>SSL-enabled pool"]
SQLite --> Types["lib/types.ts"]
PostgreSQL --> Types
MySQL --> Types
Supabase --> Types
```

**Updated** Added Supabase dependency on pg with SSL configuration

**Diagram sources**
- [index.ts](file://lib/db/index.ts#L1-L5)
- [sqlite.ts](file://lib/db/sqlite.ts#L1-L6)
- [postgresql.ts](file://lib/db/postgresql.ts#L1-L5)
- [mysql.ts](file://lib/db/mysql.ts#L1-L5)
- [supabase.ts](file://lib/db/supabase.ts#L1-L10)

**Section sources**
- [index.ts](file://lib/db/index.ts#L1-L5)

## Performance Considerations

### Connection Pooling and Optimization
- **PostgreSQL**: Uses connection pooling with max 10 connections, idle timeout 30s, connection timeout 10s, SSL enabled for production
- **MySQL**: Employs connection pooling with connection limit 10, acquire timeout 60s, operation timeout 60s
- **SQLite**: Single connection with WAL mode for optimal concurrency
- **Supabase**: Optimized for serverless with max 5 connections, idle timeout 20s, connection timeout 10s, SSL enabled with rejectUnauthorized: false

**Updated** Added Supabase-specific connection pooling configuration

### Query Optimization Strategies
- **Bulk Operations**: All implementations support transactional bulk inserts for improved performance
- **Index Utilization**: Database-specific indexes optimized for common query patterns
- **Connection Management**: Proper connection lifecycle management to prevent resource leaks
- **Serverless Optimization**: Supabase implementation optimized for cold start performance

### Scaling Recommendations
- **Development**: SQLite for simplicity and zero-dependency setup
- **Small Teams**: MySQL for good performance and reliability
- **Production**: PostgreSQL for advanced features and scalability
- **Serverless**: Supabase for Vercel deployments with automatic scaling

**Updated** Added Supabase recommendation for serverless deployments

## Backup and Migration Procedures

### Database-Specific Backup Strategies

#### SQLite Backup
- Copy the database file while application is stopped
- Recommended files: `vocab-master.db`, `vocab-master.db-wal`, `vocab-master.db-shm`
- Use SQLite's atomic commit semantics for corruption prevention

#### PostgreSQL Backup  
- Use `pg_dump` for logical backups
- Use `pg_basebackup` for physical backups
- Consider point-in-time recovery (PITR) for granular recovery

#### MySQL Backup
- Use `mysqldump` for logical backups
- Use `mysqlpump` for improved performance
- Consider binary log backups for incremental recovery

#### Supabase Backup
- Use Supabase Dashboard for automated backups
- Export data via Supabase SQL Editor for manual backups
- Leverage Supabase's built-in point-in-time recovery capabilities

**New Section** Added Supabase-specific backup procedures

### Migration Procedures
- **Schema Changes**: Apply ALTER TABLE statements within initialization routines
- **Data Migration**: Use database-specific tools for large dataset migrations
- **Rollback Strategy**: Maintain versioned migration scripts for safe rollbacks
- **Supabase Migrations**: Use Supabase CLI for managed migrations with rollback support

**Updated** Added Supabase migration procedures

## Database Security Considerations

### Connection Security
- **PostgreSQL**: Supports SSL connections, certificate validation, and encrypted authentication
- **MySQL**: Supports SSL/TLS connections, secure authentication plugins
- **SQLite**: File-based security through filesystem permissions
- **Supabase**: SSL-enabled connections with automatic certificate validation, pgbouncer support for connection pooling

**Updated** Added Supabase SSL configuration and security considerations

### Credential Management
- Environment variable configuration prevents credential exposure in code
- Docker secrets integration for production deployments
- Separate credentials for development and production environments
- Supabase connection strings with project-specific authentication

### Network Security
- PostgreSQL and MySQL require network-level security controls
- SQLite provides inherent network isolation
- Supabase offers cloud-native security with firewall rules and authentication
- Consider VPN or container networking for distributed deployments

**Updated** Added Supabase network security considerations

## Troubleshooting Guide

### Database Type Selection Issues
- **Problem**: Wrong database type selected
- **Solution**: Verify DATABASE_TYPE environment variable
- **Verification**: Check application logs for initialization messages
- **Supabase Issue**: Ensure DATABASE_TYPE=supabase for Vercel deployments

**Updated** Added Supabase-specific troubleshooting guidance

### Connection Problems
- **PostgreSQL**: Verify connection string format and network connectivity
- **MySQL**: Check MySQL service status and user privileges  
- **SQLite**: Ensure data directory permissions and file accessibility
- **Supabase**: Verify DATABASE_URL format, SSL configuration, and pgbouncer connectivity

**Updated** Added Supabase connection troubleshooting

### Performance Issues
- **Slow Queries**: Analyze query execution plans and add appropriate indexes
- **Connection Limits**: Adjust pool sizes based on workload patterns
- **Memory Usage**: Monitor database memory consumption and tune parameters
- **Serverless Cold Starts**: Optimize Supabase connection pooling and minimize initialization overhead

**Updated** Added serverless-specific performance considerations

### Docker-Specific Issues
- **Service Dependencies**: Ensure database services are healthy before application startup
- **Network Connectivity**: Verify container network configuration
- **Volume Persistence**: Check data volume mounting for SQLite deployments
- **Supabase Local Development**: Ensure proper port mapping and service health checks

**Updated** Added Supabase local development troubleshooting

### Vercel Deployment Issues
- **Environment Variables**: Ensure DATABASE_TYPE=supabase is set in Vercel dashboard
- **Connection Pooling**: Monitor Supabase connection limits and adjust pool size
- **SSL Configuration**: Verify SSL settings for production deployments
- **Cold Start Performance**: Optimize database initialization and connection reuse

**New Section** Added Vercel-specific deployment troubleshooting

**Section sources**
- [docker-compose.yml](file://docker-compose.yml#L45-L78)
- [DOCKER.md](file://DOCKER.md#L207-L268)
- [vercel.json](file://vercel.json#L13-L15)

## Conclusion
VocabMaster's multi-database architecture provides flexible deployment options suitable for various environments and use cases, now enhanced with comprehensive Supabase backend support. The unified interface abstraction enables seamless switching between SQLite, PostgreSQL, MySQL, and Supabase implementations while maintaining consistent application functionality. 

**Updated** Enhanced with Supabase backend for Vercel deployments featuring SSL configuration and serverless-optimized connection pooling. The modular design ensures that database-specific optimizations are properly handled while maintaining a clean separation of concerns, making the system maintainable and extensible for future database backend additions.

By leveraging the appropriate database type for specific deployment scenarios and following the configuration guidelines outlined in this document, you can achieve optimal performance, reliability, and scalability for your vocabulary management application across local development, self-hosted deployments, and serverless cloud environments.