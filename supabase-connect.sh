#!/bin/bash
# Helper script to connect to Supabase with timeout and IPv4 preference

# Set connection timeout (in seconds)
export PGCONNECT_TIMEOUT=10

# Force IPv4 (if your system supports it)
export PGSSLMODE=require

# Try to use direct connection instead of pooler
export SUPABASE_DB_URL="postgresql://postgres.kaokqdggrlavjurtwlcb@db.kaokqdggrlavjurtwlcb.supabase.co:5432/postgres"

# Run the supabase command with timeout
timeout 30 "$@"

