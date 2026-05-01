import { Pool } from 'pg';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Initialize pool only if DATABASE_URL is available
const pool = process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('YOUR_PASSWORD')
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
  : null;

// Initialize Supabase client as fallback
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Only these SQL operations are allowed — blocks DROP, DELETE, TRUNCATE etc.
const ALLOWED_OPERATIONS = [
  'CREATE INDEX',
  'ALTER TABLE',
  'CREATE POLICY',
  'ALTER POLICY',
  'ENABLE ROW LEVEL SECURITY',
  'DISABLE ROW LEVEL SECURITY',
  'CREATE FUNCTION',
  'COMMENT ON',
];

function isSafeSQL(sql: string): boolean {
  const upper = sql.trim().toUpperCase();

  // Block any destructive operations
  const blocked = ['DROP', 'DELETE', 'TRUNCATE', 'INSERT', 'UPDATE'];
  if (blocked.some(op => upper.startsWith(op))) return false;

  // Must start with an allowed operation
  return ALLOWED_OPERATIONS.some(op => upper.startsWith(op));
}

// Execute SQL using direct PostgreSQL connection
async function executeWithPool(sql: string) {
  if (!pool) return { error: 'Pool not available' };
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(sql);
    await client.query('COMMIT');
    return { ok: true, result: result.command };
  } catch (err: any) {
    await client.query('ROLLBACK');
    return { error: err.message };
  } finally {
    client.release();
  }
}

// Execute SQL using Supabase RPC (fallback method)
async function executeWithSupabase(sql: string) {
  try {
    const { error } = await supabase.rpc('execute_sql', { sql_query: sql });
    
    if (error) {
      return { error: error.message };
    }
    
    return { ok: true, result: 'Executed via Supabase RPC' };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function POST(req: NextRequest) {
  try {
    const { sql } = await req.json();

    if (!sql) {
      return NextResponse.json({ error: 'No SQL provided' }, { status: 400 });
    }

    if (!isSafeSQL(sql)) {
      return NextResponse.json({
        error: 'This SQL operation is not permitted. Only CREATE INDEX, ALTER TABLE, and RLS policy changes are allowed.',
      }, { status: 403 });
    }

    // Try direct PostgreSQL first (more powerful)
    if (pool) {
      const result = await executeWithPool(sql);
      if (result.ok) {
        return NextResponse.json(result);
      }
      // If direct connection fails, fall through to Supabase
    }

    // Fallback to Supabase RPC method
    const result = await executeWithSupabase(sql);
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Execute fix error:', error);
    return NextResponse.json({
      error: 'Failed to execute SQL fix',
      details: error.message,
    }, { status: 500 });
  }
}
