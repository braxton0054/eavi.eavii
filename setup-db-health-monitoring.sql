-- SQL setup for DB health monitoring
-- Run this in your Supabase SQL Editor

-- 1. Enable EXPLAIN (optional but helpful)
-- Note: This requires superuser access, may not work on all Supabase plans
-- alter role authenticator set pgrst.db_plan_enabled to true;
-- notify pgrst, 'reload config';

-- 2. RLS checker function
CREATE OR REPLACE FUNCTION get_rls_status()
RETURNS TABLE (tablename text, rls_enabled boolean)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    c.relname::text as tablename,
    c.relrowsecurity as rls_enabled
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relkind = 'r' 
    AND n.nspname = 'public'
    AND c.relname NOT LIKE 'pg_%'
    AND c.relname NOT LIKE '_pg_%'
  ORDER BY c.relname;
$$;

-- 3. Index checker function
CREATE OR REPLACE FUNCTION get_indexes()
RETURNS TABLE (tablename text, indexname text, indexdef text)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    tablename::text,
    indexname::text,
    indexdef::text
  FROM pg_indexes
  WHERE schemaname = 'public'
  ORDER BY tablename, indexname;
$$;

-- 4. Row counts function (using pg_stat_user_tables)
CREATE OR REPLACE FUNCTION get_table_row_counts()
RETURNS TABLE (tablename text, row_count bigint)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    relname::text as tablename,
    n_live_tup::bigint as row_count
  FROM pg_stat_user_tables
  WHERE schemaname = 'public'
  ORDER BY n_live_tup DESC;
$$;

-- 5. Foreign keys function
CREATE OR REPLACE FUNCTION get_foreign_keys()
RETURNS TABLE (
  table_name text,
  column_name text,
  foreign_table text,
  foreign_column text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    kcu.table_name::text,
    kcu.column_name::text,
    ccu.table_name::text as foreign_table,
    ccu.column_name::text as foreign_column
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
  ORDER BY tc.table_name, kcu.column_name;
$$;

-- 6. Scan history table
CREATE TABLE IF NOT EXISTS db_health_scans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  scanned_at timestamptz DEFAULT now(),
  score int,
  issue_count int,
  tables_without_rls int,
  tables_without_indexes int,
  issues jsonb
);

-- Enable RLS on the scan history table
ALTER TABLE db_health_scans ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read scan history
CREATE POLICY "Allow authenticated read access"
  ON db_health_scans FOR SELECT
  TO authenticated
  USING (true);

-- Allow service role to insert scan results
CREATE POLICY "Allow service role insert"
  ON db_health_scans FOR INSERT
  TO service_role
  WITH CHECK (true);

-- 7. Grant execute permissions
GRANT EXECUTE ON FUNCTION get_rls_status() TO authenticated;
GRANT EXECUTE ON FUNCTION get_rls_status() TO service_role;
GRANT EXECUTE ON FUNCTION get_indexes() TO authenticated;
GRANT EXECUTE ON FUNCTION get_indexes() TO service_role;
GRANT EXECUTE ON FUNCTION get_table_row_counts() TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_row_counts() TO service_role;
GRANT EXECUTE ON FUNCTION get_foreign_keys() TO authenticated;
GRANT EXECUTE ON FUNCTION get_foreign_keys() TO service_role;

-- 8. Create a view for easy access to scan history
CREATE OR REPLACE VIEW latest_db_health_scan AS
SELECT *
FROM db_health_scans
ORDER BY scanned_at DESC
LIMIT 1;

-- 10. Create execute_sql function for one-click fix execution
-- WARNING: This allows executing arbitrary SQL. Only enable if you need the one-click fix feature.
-- The application has its own safety checks, but use with caution.
CREATE OR REPLACE FUNCTION execute_sql(sql_query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Safety check: only allow safe operations
  IF sql_query IS NULL OR sql_query = '' THEN
    RAISE EXCEPTION 'Empty SQL query';
  END IF;
  
  -- Block dangerous operations
  IF upper(sql_query) ~* '^(DROP|DELETE|TRUNCATE)\s' THEN
    RAISE EXCEPTION 'Dangerous operation not allowed: %', sql_query;
  END IF;
  
  -- Only allow specific safe operations
  IF NOT (upper(sql_query) ~* '^(CREATE INDEX|ALTER TABLE|CREATE POLICY|ALTER POLICY|ENABLE|DISABLE|CREATE FUNCTION|COMMENT ON)\s') THEN
    RAISE EXCEPTION 'Operation not permitted. Only CREATE INDEX, ALTER TABLE, RLS policies allowed.';
  END IF;
  
  EXECUTE sql_query;
END;
$$;

-- Grant execute permission to service role only
GRANT EXECUTE ON FUNCTION execute_sql(text) TO service_role;
REVOKE EXECUTE ON FUNCTION execute_sql(text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION execute_sql(text) FROM anon;

-- Success message (this will show in the output)
SELECT 'DB health monitoring setup complete!' as status;
SELECT 'Functions created: get_rls_status, get_indexes, get_table_row_counts, get_foreign_keys, execute_sql' as functions;
SELECT 'Table created: db_health_scans' as table_created;
