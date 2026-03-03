// Database factory - supports dynamic switching between database backends
import { IDatabase } from './types';
import { SupabaseDatabase } from './supabase';

// Lazy imports for optional database backends (Docker deployments)
let SQLiteDatabase: any = null;
let PostgreSQlDatabase: any = null;
let MySQLDatabase: any = null;

let instance: IDatabase | null = null;
let initializing = false;

/**
 * Get the database instance (singleton).
 * Dynamically selects the database implementation based on DATABASE_TYPE environment variable.
 * Supported types: 'supabase' (default for Vercel), 'sqlite', 'postgresql', 'mysql'
 */
export async function getDatabase(): Promise<IDatabase> {
  if (instance && !initializing) {
    return instance;
  }

  if (initializing) {
    // Wait for initialization to complete
    while (initializing) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    return instance!;
  }

  initializing = true;
  
  try {
    const databaseType = process.env.DATABASE_TYPE || 'supabase';
    
    switch (databaseType.toLowerCase()) {
      case 'supabase':
        // Default for Vercel/cloud deployments
        instance = new SupabaseDatabase();
        break;
      case 'postgresql':
        // For Docker/self-hosted PostgreSQL
        if (!PostgreSQlDatabase) {
          const mod = await import('./postgresql');
          PostgreSQlDatabase = mod.PostgreSQlDatabase;
        }
        instance = new PostgreSQlDatabase();
        break;
      case 'mysql':
        // For Docker/self-hosted MySQL
        if (!MySQLDatabase) {
          const mod = await import('./mysql');
          MySQLDatabase = mod.MySQLDatabase;
        }
        instance = new MySQLDatabase();
        break;
      case 'sqlite':
        // For local development/Docker SQLite
        if (!SQLiteDatabase) {
          const mod = await import('./sqlite');
          SQLiteDatabase = mod.SQLiteDatabase;
        }
        instance = new SQLiteDatabase();
        break;
      default:
        // Default to Supabase for unknown types
        instance = new SupabaseDatabase();
        break;
    }
    
    if (!instance) {
      throw new Error(`Failed to create database instance for type: ${databaseType}`);
    }
    
    await instance.initialize();
    return instance;
  } finally {
    initializing = false;
  }
}

export type { IDatabase, UserStats } from './types';
