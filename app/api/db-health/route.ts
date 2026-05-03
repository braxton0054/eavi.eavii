import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RLSStatus {
  tablename: string;
  rls_enabled: boolean;
}

interface IndexInfo {
  tablename: string;
  indexname: string;
}

interface RowCountInfo {
  tablename: string;
  row_count: number;
}

interface ForeignKeyInfo {
  table_name: string;
  column_name: string;
  foreign_table_name: string;
  foreign_column_name: string;
}

interface HealthIssue {
  type: 'security' | 'performance' | 'data_integrity';
  severity: 'high' | 'medium' | 'low';
  table: string;
  message: string;
  details?: string;
}

export async function GET() {
  try {
    const supabase = getSupabase();
    // Use raw SQL queries since we may not have the RPC functions set up
    const { data: rlsData, error: rlsError } = await supabase.rpc('get_rls_status');
    const { data: indexData, error: indexError } = await supabase.rpc('get_indexes');
    const { data: rowCounts, error: rowCountError } = await supabase.rpc('get_table_row_counts');
    const { data: foreignKeys, error: fkError } = await supabase.rpc('get_foreign_keys');

    // Fallback to direct queries if RPC functions don't exist
    let finalRlsData: RLSStatus[] = rlsData || [];
    let finalIndexData: IndexInfo[] = indexData || [];
    let finalRowCounts: RowCountInfo[] = rowCounts || [];
    let finalForeignKeys: ForeignKeyInfo[] = foreignKeys || [];

    if (rlsError) {
      // Query RLS status directly
      const { data } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');
      
      if (data) {
        finalRlsData = await Promise.all(
          data.map(async (t) => {
            try {
              const { data: rlsInfo } = await supabase
                .rpc('check_rls_status', { table_name: t.table_name });
              return {
                tablename: t.table_name,
                rls_enabled: rlsInfo?.rls_enabled || false,
              };
            } catch {
              return {
                tablename: t.table_name,
                rls_enabled: false,
              };
            }
          })
        );
      }
    }

    // Find tables with no RLS
    const noRls = finalRlsData.filter(t => !t.rls_enabled).map(t => t.tablename);

    // Find tables with no indexes (other than primary key)
    const indexedTables = new Set(finalIndexData.map(i => i.tablename));
    const allTables = finalRlsData.map(t => t.tablename);
    const noIndexes = allTables.filter(t => !indexedTables.has(t));

    // Find large tables (over 10k rows) with no indexes
    const largeTables = finalRowCounts
      .filter(t => t.row_count > 10000)
      .map(t => t.tablename);

    const issues: HealthIssue[] = [];

    noRls.forEach(t => {
      issues.push({
        type: 'security',
        severity: 'high',
        table: t,
        message: `Table "${t}" has RLS disabled — all data is publicly accessible`,
        details: 'Row Level Security (RLS) policies control access to rows in database tables. Without RLS, any authenticated user can read all data.',
      });
    });

    noIndexes.forEach(t => {
      issues.push({
        type: 'performance',
        severity: 'medium',
        table: t,
        message: `Table "${t}" has no indexes — queries will do full table scans`,
        details: 'Indexes speed up data retrieval operations. Without indexes, PostgreSQL must scan every row to find matching data.',
      });
    });

    largeTables.forEach(t => {
      const rowCount = finalRowCounts.find(r => r.tablename === t)?.row_count || 0;
      if (noIndexes.includes(t)) {
        issues.push({
          type: 'performance',
          severity: 'high',
          table: t,
          message: `Table "${t}" has ${rowCount.toLocaleString()} rows but no indexes — critical performance risk`,
          details: 'Large tables without indexes cause slow queries and can impact overall database performance.',
        });
      }
    });

    // Check for tables without foreign keys referencing them
    const tablesWithFKs = new Set(finalForeignKeys.map(fk => fk.table_name));
    const tablesReferenced = new Set(finalForeignKeys.map(fk => fk.foreign_table_name));
    
    // Find orphaned tables (no FKs in or out) - might indicate missing relationships
    const orphanedTables = allTables.filter(t => 
      !tablesWithFKs.has(t) && !tablesReferenced.has(t) && 
      !['migrations', 'schema_migrations'].includes(t)
    );

    orphanedTables.forEach(t => {
      if (!['ai_chat_history', 'ai_long_term_memory', 'ai_user_facts', 'system_logs'].includes(t)) {
        issues.push({
          type: 'data_integrity',
          severity: 'low',
          table: t,
          message: `Table "${t}" has no foreign key relationships — may indicate isolated data`,
          details: 'Tables without relationships to other tables may have orphaned data or missing relational constraints.',
        });
      }
    });

    // Calculate health score
    const score = Math.max(0, 100 - (noRls.length * 15) - (noIndexes.length * 5) - (orphanedTables.length * 2));

    return NextResponse.json({
      summary: {
        totalTables: allTables.length,
        tablesWithoutRls: noRls.length,
        tablesWithoutIndexes: noIndexes.length,
        largeTablesWithoutIndexes: largeTables.filter(t => noIndexes.includes(t)).length,
        orphanedTables: orphanedTables.length,
        issueCount: issues.length,
        healthScore: score,
        status: score >= 90 ? 'healthy' : score >= 70 ? 'warning' : 'critical',
      },
      issues: issues.sort((a, b) => {
        const severityOrder = { high: 0, medium: 1, low: 2 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      }),
      metadata: {
        totalRowCount: finalRowCounts.reduce((sum, t) => sum + t.row_count, 0),
        largestTable: finalRowCounts.sort((a, b) => b.row_count - a.row_count)[0]?.tablename || 'N/A',
        totalIndexes: finalIndexData.length,
        totalForeignKeys: finalForeignKeys.length,
      },
    });
  } catch (err: any) {
    console.error('DB Health Check Error:', err);
    return NextResponse.json(
      { error: 'Failed to analyze database health', details: err.message },
      { status: 500 }
    );
  }
}
