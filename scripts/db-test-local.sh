#!/usr/bin/env bash
# Runs the migrations + pgTAP RLS tests against a throwaway local Postgres cluster.
# Needs: postgresql@17 (brew install postgresql@17) and the pgtap extension built for it.
# Without Docker you cannot run `supabase test db`; this script is the equivalent.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PGBIN="${PGBIN:-/opt/homebrew/opt/postgresql@17/bin}"
DATA="${PGDATA_LOCAL:-${TMPDIR:-/tmp}/cupcasa-pg17}"
PORT="${PGPORT_LOCAL:-54329}"
DB="cupcasa_test"
export PATH="$PGBIN:$PATH"

if [ ! -d "$DATA" ]; then
  initdb -D "$DATA" -U postgres --auth=trust >/dev/null
fi
if ! pg_ctl -D "$DATA" status >/dev/null 2>&1; then
  pg_ctl -D "$DATA" -o "-p $PORT -k /tmp" -l "$DATA/server.log" start >/dev/null
  sleep 1
fi
PSQL="psql -v ON_ERROR_STOP=1 -q -h /tmp -p $PORT -U postgres"

$PSQL -d postgres -c "drop database if exists $DB" >/dev/null
$PSQL -d postgres -c "create database $DB" >/dev/null

echo "▸ stub"
$PSQL -d $DB -f "$ROOT/scripts/local-pg/00_supabase_stub.sql"
for f in "$ROOT"/supabase/migrations/0001_schema.sql "$ROOT"/supabase/migrations/0002_functions.sql "$ROOT"/supabase/migrations/0003_rls.sql "$ROOT"/supabase/migrations/0005_profiles_shared_cafe.sql; do
  echo "▸ $(basename "$f")"
  $PSQL -d $DB -f "$f"
done
# 0004 needs pg_cron/pg_net/vault, which only exist on Supabase — skipped locally.

status=0
for t in "$ROOT"/supabase/tests/*.sql; do
  echo "▸ $(basename "$t")"
  out="$(psql -h /tmp -p $PORT -U postgres -d $DB -X -q -A -t -f "$t" 2>&1)" || status=1
  echo "$out"
  if echo "$out" | grep -qE '^not ok|ERROR|Looks like you failed'; then status=1; fi
done

if [ "${KEEP_PG:-0}" != "1" ]; then pg_ctl -D "$DATA" stop -m fast >/dev/null; fi
exit $status
