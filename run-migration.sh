#!/bin/bash

# This script runs the migration to add missing columns to the Supabase database
# Requires: psql to be installed and SUPABASE_DB_URL environment variable set

echo "Running database migration..."

# Check if we have the connection string
if [ -z "$SUPABASE_DB_URL" ]; then
  echo "Error: SUPABASE_DB_URL environment variable not set"
  echo "Set it to your Supabase PostgreSQL connection string"
  exit 1
fi

# Run the migration file
psql "$SUPABASE_DB_URL" < ADD_MISSING_COLUMNS.sql

echo "Migration completed!"
