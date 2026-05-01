/**
 * Fetches Supabase database schema for chatbot context
 * This utility retrieves the OpenAPI spec from Supabase REST API
 * and extracts table/column information for AI context
 */

export async function getSupabaseSchema() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.error('Missing Supabase URL or key for schema fetch')
    return []
  }

  try {
    const res = await fetch(`${url}/rest/v1/`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    })

    if (!res.ok) {
      console.error('Failed to fetch Supabase schema:', res.status, res.statusText)
      return []
    }

    const spec = await res.json()

    // Extract table and column information
    return Object.entries(spec.definitions || {}).map(([tableName, def]) => ({
      table: tableName,
      columns: Object.entries(def.properties || {}).map(([colName, colDef]) => ({
        name: colName,
        type: colDef.type || colDef.format || 'unknown',
        description: colDef.description || '',
      })),
    }))
  } catch (error) {
    console.error('Error fetching Supabase schema:', error)
    return []
  }
}

/**
 * Formats the schema into a readable string for AI context
 */
export function formatSchemaForAI(schema) {
  if (!schema || schema.length === 0) {
    return 'Database schema information not available.'
  }

  return schema
    .map(t => `Table: ${t.table} | Columns: ${t.columns.map(c => `${c.name}(${c.type})`).join(', ')}`)
    .join('\n')
}

/**
 * Gets a simplified schema with just table names and key columns
 * Useful for reducing token usage
 */
export function getSimplifiedSchema(schema, maxColumns = 10) {
  if (!schema || schema.length === 0) {
    return 'Database schema information not available.'
  }

  return schema
    .map(t => {
      // Prioritize key columns
      const priorityCols = ['id', 'name', 'full_name', 'email', 'status', 'course', 'campus', 'created_at', 'updated_at']
      const sortedCols = [...t.columns].sort((a, b) => {
        const aPriority = priorityCols.indexOf(a.name)
        const bPriority = priorityCols.indexOf(b.name)
        if (aPriority !== -1 && bPriority !== -1) return aPriority - bPriority
        if (aPriority !== -1) return -1
        if (bPriority !== -1) return 1
        return 0
      })

      const displayCols = sortedCols.slice(0, maxColumns)
      const remainingCount = t.columns.length - displayCols.length

      const cols = displayCols
        .map(c => `${c.name}(${c.type})`)
        .join(', ')

      return `${t.table}: ${cols}${remainingCount > 0 ? ` (+${remainingCount} more)` : ''}`
    })
    .join('\n')
}

/**
 * Gets ultra-minimal schema with just table names
 * For when token limits are very tight
 */
export function getMinimalSchema(schema) {
  if (!schema || schema.length === 0) {
    return 'Database schema information not available.'
  }
  return 'Tables: ' + schema.map(t => t.table).join(', ')
}
