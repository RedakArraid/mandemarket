#!/usr/bin/env bash
# ==============================================================================
# MandeMarket - Script de restauration PostgreSQL (MM-INF-093)
# ==============================================================================

set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <chemin_du_fichier_backup.sql.gz>"
  echo "Exemple: $0 /backups/mandemarket/mandemarket_backup_20260913_120000.sql.gz"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "❌ ERREUR: Le fichier spécifié n'existe pas : ${BACKUP_FILE}"
  exit 1
fi

DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${POSTGRES_USER:-mandemarket}"
DB_NAME="${POSTGRES_DB:-mandemarket_db}"
export PGPASSWORD="${POSTGRES_PASSWORD:-mandemarket_secure_password_2024}"

echo "⚠️ ATTENTION: Cette opération va restaurer la base '${DB_NAME}' sur ${DB_HOST}:${DB_PORT}."
echo "Source: ${BACKUP_FILE}"
if [ "${FORCE_RESTORE:-0}" != "1" ]; then
  read -p "Confirmez-vous la restauration ? (oui/non) : " CONFIRM
  if [ "${CONFIRM}" != "oui" ]; then
    echo "Restauration annulée."
    exit 0
  fi
fi

echo "[$(date +'%Y-%m-%dT%H:%M:%S')] 🔄 Début de la décompression et restauration..."
gunzip -c "${BACKUP_FILE}" | psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" --single-transaction

echo "[$(date +'%Y-%m-%dT%H:%M:%S')] ✅ Restauration terminée avec succès !"
echo "[$(date +'%Y-%m-%dT%H:%M:%S')] 🔍 Vérification de la cohérence..."
psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -c "SELECT count(*) AS total_users FROM \"User\";"
