#!/usr/bin/env bash
set -euo pipefail

# Uso:
#   ./scripts/backup-db.sh
# Cron ejemplo (diario 02:30 America/Asuncion):
#   30 2 * * * cd /path/Ykuatia-Back-End && ./scripts/backup-db.sh >> logs/backup.log 2>&1

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

: "${DB_HOST:?DB_HOST requerido}"
: "${DB_USER:?DB_USER requerido}"
: "${DB_DATABASE:?DB_DATABASE requerido}"

RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
OUT_DIR="${BACKUP_DIR:-$ROOT_DIR/backups}"
mkdir -p "$OUT_DIR"

STAMP="$(date +%Y%m%d-%H%M)"
FILE="$OUT_DIR/ykuatia-$STAMP.sql.gz"

export MYSQL_PWD="${DB_PASSWORD:-}"
mysqldump \
  -h "$DB_HOST" \
  -u "$DB_USER" \
  --single-transaction \
  --routines \
  --triggers \
  "$DB_DATABASE" | gzip > "$FILE"

unset MYSQL_PWD

find "$OUT_DIR" -type f -name 'ykuatia-*.sql.gz' -mtime +"$RETENTION_DAYS" -delete

echo "Backup OK: $FILE"
