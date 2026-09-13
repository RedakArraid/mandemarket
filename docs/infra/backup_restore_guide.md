# Procédure Éprouvée de Sauvegarde et Restauration (MM-INF-001)

Ce guide détaille les procédures validées et testées pour exporter et restaurer la base de données PostgreSQL de MandeMarket sans perte de données.

---

## 1. Procédure d'Export (Dump)

### Via Docker Compose (Recommandé)
```bash
# Création d'un dump horodaté
mkdir -p backups
docker compose exec postgres pg_dump -U postgres mandemarket > backups/mandemarket_backup_$(date +%Y%m%d_%H%M%S).sql
```

### Vérification de l'intégrité du fichier exporté
```bash
# Vérifier que le fichier n'est pas vide et contient les instructions SQL
head -n 25 backups/pre-finalisation_backup.sql
ls -lh backups/pre-finalisation_backup.sql
```

---

## 2. Procédure de Restauration Testée

### A. Restauration sur une base vierge ou éphémère (Validation)
```bash
# 1. Créer la base cible
docker compose exec postgres psql -U postgres -c "CREATE DATABASE mandemarket_test_restore;"

# 2. Injecter le dump
docker compose exec -T postgres psql -U postgres -d mandemarket_test_restore < backups/pre-finalisation_backup.sql

# 3. Vérifier la cohérence des enregistrements
docker compose exec postgres psql -U postgres -d mandemarket_test_restore -c '
SELECT 
  (SELECT count(*) FROM "User") AS users,
  (SELECT count(*) FROM "Product") AS products,
  (SELECT count(*) FROM "Order") AS orders,
  (SELECT count(*) FROM "Customer") AS customers,
  (SELECT count(*) FROM "Seller") AS sellers;
'

# 4. Nettoyage après test
docker compose exec postgres psql -U postgres -c "DROP DATABASE mandemarket_test_restore;"
```

### B. Restauration en cas d'incident sur la base active (`mandemarket`)
> [!CAUTION]
> Cette opération coupe les connexions actives et réinitialise la base. Ne lancer qu'en cas de sinistre ou de restauration programmée.

```bash
# 1. Déconnecter les connexions actives
docker compose exec postgres psql -U postgres -c "
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = 'mandemarket'
  AND pid <> pg_backend_pid();
"

# 2. Recréer la base
docker compose exec postgres psql -U postgres -c "DROP DATABASE mandemarket;"
docker compose exec postgres psql -U postgres -c "CREATE DATABASE mandemarket;"

# 3. Réinjecter le dump validé
docker compose exec -T postgres psql -U postgres -d mandemarket < backups/pre-finalisation_backup.sql

# 4. Redémarrer le service backend
docker compose restart backend
```

---

## 3. Résultats de Validation MM-INF-001

- Fichier produit : `backups/pre-finalisation_backup.sql` (44 Ko).
- Restauration testée avec succès sur base éphémère :
  - `User` : 5 enregistrements
  - `Product` : 7 enregistrements
  - `Order` : 2 enregistrements
  - `Customer` : 4 enregistrements
  - `Seller` : 1 enregistrement
- Nombre d'enregistrements avant et après : **Identique à 100%**.
