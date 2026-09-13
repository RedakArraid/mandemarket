# Plan de Reprise d'Activité et Sauvegardes MandeMarket (MM-INF-093)

Ce document formalise les procédures de sauvegarde, de reprise après sinistre et les objectifs de service pour la plateforme MandeMarket.

---

## 1. Objectifs de Reprise

| Métrique | Valeur Cible | Description |
|---|---|---|
| **RPO** (*Recovery Point Objective*) | **≤ 1 heure** | Perte maximale admissible de données en cas de sinistre majeur. |
| **RTO** (*Recovery Time Objective*) | **≤ 15 minutes** | Temps maximal nécessaire pour restaurer la base et redémarrer les services. |

---

## 2. Politique de Sauvegarde

### 2.1 Base de Données PostgreSQL
- **Fréquence** : Sauvegarde complète toutes les heures via cron/tâche planifiée.
- **Format** : Archive compressée `gzip` (`mandemarket_backup_YYYYMMDD_HHMMSS.sql.gz`).
- **Options de dump** : `--clean --if-exists --no-owner --no-privileges --single-transaction`.
- **Rétention** :
  - Sauvegardes horaires : conservées pendant 48 heures.
  - Sauvegardes journalières : conservées pendant 14 jours.
  - Sauvegardes mensuelles : conservées pendant 12 mois dans un bucket S3 / stockage froid distant.

### 2.2 Médias et Documents
- Les images de produits, bannières et logos sont stockées sur le CDN Cloudinary sécurisé avec réplication multi-régions.
- Les fichiers de configuration (.env chiffrés, secrets) sont conservés dans un gestionnaire de secrets sécurisé (Vault / Bitwarden / Secrets Manager).

---

## 3. Procédure de Sauvegarde Manuelle

Pour déclencher une sauvegarde manuelle immédiate avant une mise en production ou une migration critique :

```bash
# Depuis l'hôte ou le conteneur backend :
./backend/scripts/backup-db.sh

# Ou via Docker Compose :
docker compose exec backend /app/scripts/backup-db.sh
```

Le fichier de sauvegarde est créé dans le répertoire configuré (`/backups/mandemarket`).

---

## 4. Procédure de Restauration d'Urgence

### 4.1 Restauration sur environnement Staging ou Production
1. **Identifier la dernière sauvegarde saine** :
   ```bash
   ls -lt /backups/mandemarket/mandemarket_backup_*.sql.gz | head -n 5
   ```

2. **Arrêter les flux entrants (mode maintenance)** :
   ```bash
   # Mettre le frontend en maintenance ou stopper l'instance backend
   docker compose stop backend
   ```

3. **Exécuter la restauration** :
   ```bash
   ./backend/scripts/restore-db.sh /backups/mandemarket/mandemarket_backup_20260913_120000.sql.gz
   ```

4. **Appliquer les migrations de schéma si nécessaire** :
   ```bash
   cd backend && npx prisma migrate deploy
   ```

5. **Exécuter la vérification de réconciliation comptable** :
   ```bash
   npm run reconciliation:check
   ```

6. **Redémarrer les services et valider les healthchecks** :
   ```bash
   docker compose up -d backend frontend
   curl -fsSL http://localhost:4002/health/ready
   ```

---

## 5. Test Périodique de Restauration
Conformément aux exigences de la Phase 9 (`MM-INF-093`), la procédure de restauration doit être exécutée et validée à blanc au moins une fois par trimestre sur une base de recette isolée.
