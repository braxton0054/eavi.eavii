/**
 * Fetches Supabase database schema for chatbot context
 * This utility retrieves the OpenAPI spec from Supabase REST API
 * and extracts table/column information for AI context
 */

interface ColumnInfo {
  name: string;
  type: string;
  description?: string;
  format?: string;
  isNullable?: boolean;
}

interface TableInfo {
  table: string;
  columns: ColumnInfo[];
}

let cachedSchema: TableInfo[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000; // Cache for 5 minutes

export async function getSupabaseSchema(): Promise<TableInfo[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error('Missing Supabase URL or key for schema fetch');
    return [];
  }

  // Check cache first
  const now = Date.now();
  if (cachedSchema && (now - cacheTimestamp) < CACHE_DURATION_MS) {
    return cachedSchema;
  }

  try {
    // Fetch the OpenAPI spec from Supabase REST endpoint
    const res = await fetch(`${url}/rest/v1/`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Accept': 'application/openapi+json',
      },
    });

    if (!res.ok) {
      console.error('Failed to fetch Supabase schema:', res.status, res.statusText);
      return cachedSchema || []; // Return stale cache if available
    }

    const spec = await res.json();

    // Extract table and column information
    const tables: TableInfo[] = Object.entries(spec.definitions || {}).map(([tableName, def]: [string, any]) => {
      const columns: ColumnInfo[] = Object.entries(def.properties || {}).map(([colName, colDef]: [string, any]) => ({
        name: colName,
        type: colDef.type || colDef.format || 'unknown',
        format: colDef.format,
        description: colDef.description || '',
        isNullable: !def.required?.includes(colName),
      }));

      return { table: tableName, columns };
    });

    // Update cache
    cachedSchema = tables;
    cacheTimestamp = now;

    return tables;
  } catch (error) {
    console.error('Error fetching Supabase schema:', error);
    return cachedSchema || []; // Return stale cache if available
  }
}

/**
 * Formats the schema into a readable string for AI context
 */
export function formatSchemaForAI(schema: TableInfo[]): string {
  if (!schema || schema.length === 0) {
    return 'Database schema information not available.';
  }

  return schema
    .map(t => {
      const cols = t.columns
        .map(c => {
          let colDesc = `${c.name} (${c.type}${c.format ? `/${c.format}` : ''})`;
          if (!c.isNullable) colDesc += ' [required]';
          if (c.description) colDesc += ` - ${c.description}`;
          return colDesc;
        })
        .join('\n    - ');
      return `Table: ${t.table}\n  Columns:\n    - ${cols}`;
    })
    .join('\n\n');
}

/**
 * Gets a simplified schema with just table names and key columns
 * Useful for reducing token usage
 */
export function getSimplifiedSchema(schema: TableInfo[], maxColumns: number = 10): string {
  if (!schema || schema.length === 0) {
    return 'Database schema information not available.';
  }

  return schema
    .map(t => {
      // Prioritize key columns: id, name, email, status, created_at, etc.
      const priorityCols = ['id', 'name', 'full_name', 'email', 'status', 'course', 'campus', 'created_at', 'updated_at'];
      const sortedCols = [...t.columns].sort((a, b) => {
        const aPriority = priorityCols.indexOf(a.name);
        const bPriority = priorityCols.indexOf(b.name);
        if (aPriority !== -1 && bPriority !== -1) return aPriority - bPriority;
        if (aPriority !== -1) return -1;
        if (bPriority !== -1) return 1;
        return 0;
      });

      const displayCols = sortedCols.slice(0, maxColumns);
      const remainingCount = t.columns.length - displayCols.length;

      const cols = displayCols
        .map(c => `${c.name}(${c.type}${!c.isNullable ? ',required' : ''})`)
        .join(', ');

      return `${t.table}: ${cols}${remainingCount > 0 ? ` (+${remainingCount} more)` : ''}`;
    })
    .join('\n');
}
