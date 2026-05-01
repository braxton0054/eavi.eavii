-- SQL functions for DB health scanner
-- Run these in Supabase SQL Editor to enable the health check API

-- Function to get RLS status for all tables
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

-- Function to get all indexes
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

-- Function to get row counts for all tables
CREATE OR REPLACE FUNCTION get_table_row_counts()
RETURNS TABLE (tablename text, row_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT c.relname as table_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'r' 
      AND n.nspname = 'public'
      AND c.relname NOT LIKE 'pg_%'
      AND c.relname NOT LIKE '_pg_%'
    ORDER BY c.relname
  LOOP
    tablename := r.table_name;
    EXECUTE format('SELECT COUNT(*) FROM %I', r.table_name) INTO row_count;
    RETURN NEXT;
  END LOOP;
END;
$$;

-- Function to get all foreign keys
CREATE OR REPLACE FUNCTION get_foreign_keys()
RETURNS TABLE (
  table_name text,
  column_name text,
  foreign_table_name text,
  foreign_column_name text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    tc.table_name::text,
    kcu.column_name::text,
    ccu.table_name::text as foreign_table_name,
    ccu.column_name::text as foreign_column_name
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

-- Alternative simpler function to check if RLS is enabled on a specific table
CREATE OR REPLACE FUNCTION check_rls_status(table_name text)
RETURNS TABLE (rls_enabled boolean)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT relrowsecurity as rls_enabled
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relname = table_name
    AND n.nspname = 'public'
    AND c.relkind = 'r';
$$;

-- Grant execute permissions to authenticated and service roles
GRANT EXECUTE ON FUNCTION get_rls_status() TO authenticated;
GRANT EXECUTE ON FUNCTION get_rls_status() TO service_role;
GRANT EXECUTE ON FUNCTION get_indexes() TO authenticated;
GRANT EXECUTE ON FUNCTION get_indexes() TO service_role;
GRANT EXECUTE ON FUNCTION get_table_row_counts() TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_row_counts() TO service_role;
GRANT EXECUTE ON FUNCTION get_foreign_keys() TO authenticated;
GRANT EXECUTE ON FUNCTION get_foreign_keys() TO service_role;
GRANT EXECUTE ON FUNCTION check_rls_status(text) TO authenticated;
GRANT EXECUTE ON FUNCTION check_rls_status(text) TO service_role;
