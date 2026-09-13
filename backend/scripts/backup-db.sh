#!/usr/bin/env bash
# ==============================================================================
# MandeMarket - Script de sauvegarde PostgreSQL automatisé (MM-INF-093)
# ==============================================================================

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/backups/mandemarket}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
TIMESTAMP="$(date +'%Y%m%d_%H%M%S')"
BACKUP_FILE="${BACKUP_DIR}/mandemarket_backup_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

echo "[$(date +'%Y-%m-%dT%H:%M:%S')] 🚀 Démarrage de la sauvegarde MandeMarket..."

# Définition des variables de connexion
DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${POSTGRES_USER:-mandemarket}"
DB_NAME="${POSTGRES_DB:-mandemarket_db}"
export PGPASSWORD="${POSTGRES_PASSWORD:-mandemarket_secure_password_2024}"

# Exécution du pg_dump avec compression gzip
pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" --clean --if-exists --no-owner --no-privileges | gzip -9 > "${BACKUP_FILE}"

# Vérification de l'intégrité du fichier généré
FILESIZE=$(stat -c%s "${BACKUP_FILE}" 2>/dev/null || stat -f%z "${BACKUP_FILE}" 2>/dev/null || echo "0")
if [ "${FILESIZE}" -lt 1024 ]; then
  echo "❌ ERREUR: Le fichier de sauvegarde est trop petit (${FILESIZE} octets). Échec probable."
  exit 1
fi

echo "[$(date +'%Y-%m-%dT%H:%M:%S')] ✅ Sauvegarde réussie : ${BACKUP_FILE} (${FILESIZE} octets)"

# Application de la politique de rétention (suppression des fichiers de plus de X jours)
echo "[$(date +'%Y-%m-%dT%H:%M:%S')] 🧹 Nettoyage des sauvegardes antérieures à ${RETENTION_DAYS} jours..."
find "${BACKUP_DIR}" -name "mandemarket_backup_*.sql.gz" -mtime +"${RETENTION_DAYS}" -exec rm -f {} + || true

echo "[$(date +'%Y-%m-%dT%H:%M:%S')] 🏁 Sauvegarde terminée avec succès."
