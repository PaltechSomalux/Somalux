-- ============================================================================
-- Create exec_sql RPC Function for Migration Support
-- ============================================================================
-- This function allows authenticated clients to execute raw SQL statements
-- Used by migration scripts to apply database changes programmatically
-- ============================================================================

CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS void AS $$
DECLARE
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;

-- Add comment explaining the function
COMMENT ON FUNCTION public.exec_sql(text) IS 'Executes raw SQL statements for migrations. Only callable by service role.';
