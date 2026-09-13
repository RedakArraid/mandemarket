# Guide de Déploiement en Production et Exploitation MandeMarket (MM-INF-101 & MM-MGR-102)

Ce guide décrit la séquence opérationnelle rigoureuse pour déployer la version finale de MandeMarket sur l'infrastructure de production Docker / Traefik.

---

## 1. Pré-requis de Déploiement

Avant d'initier le déploiement sur le serveur cible :
1. Clés d'API live configurées dans le gestionnaire de secrets :
   - CinetPay (`CINETPAY_API_KEY`, `CINETPAY_SITE_ID`, `CINETPAY_SECRET_KEY`)
   - Paystack (`PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY`)
   - Stripe (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`)
   - Cloudinary (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`)
   - SMTP Transactionnel (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`)
2. Vérifier que les noms d'hôtes DNS pointent correctement vers le serveur Traefik :
   - Frontend : `mandemarket.soubadigital.com`
   - Backend API : `apimandemarket.soubadigital.com`

---

## 2. Procédure Pas à Pas de Déploiement

### Étape 1 : Sauvegarde de sécurité pré-déploiement
```bash
./backend/scripts/backup-db.sh
```

### Étape 2 : Récupération de la branche de release
```bash
git checkout feature/finalisation-production
git pull origin feature/finalisation-production
```

### Étape 3 : Déploiement des migrations de base de données
```bash
cd backend
npx prisma migrate deploy
cd ..
```

### Étape 4 : Construction et redémarrage des conteneurs
```bash
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d --remove-orphans
```

### Étape 5 : Validation immédiate des sondes de santé
```bash
# Vérifier la disponibilité de l'API
curl -fsSL https://apimandemarket.soubadigital.com/health/ready

# Vérifier la liveness
curl -fsSL https://apimandemarket.soubadigital.com/health/live

# Vérifier le frontend
curl -fsSL https://mandemarket.soubadigital.com/
```

### Étape 6 : Contrôle de réconciliation post-déploiement
```bash
docker compose -f docker-compose.prod.yml exec backend npm run reconciliation:check
```

---

## 3. Plan de Rollback Rapide

En cas d'anomalie critique lors des smoke tests post-déploiement :
1. **Restaurer la base de données** à son état pré-déploiement :
   ```bash
   ./backend/scripts/restore-db.sh /backups/mandemarket/mandemarket_backup_PRE_DEPLOY.sql.gz
   ```
2. **Rebasculer sur l'image ou le commit précédent** :
   ```bash
   git checkout <PREVIOUS_RELEASE_TAG_OR_COMMIT>
   docker compose -f docker-compose.prod.yml up -d
   ```
3. **Vérifier l'état opérationnel** :
   ```bash
   curl -fsSL https://apimandemarket.soubadigital.com/health/ready
   ```

---

## 4. Protocole de Suivi Post-Release (MM-MGR-102)

1. **Surveillance des logs temps réel (RequestId)** :
   ```bash
   docker compose -f docker-compose.prod.yml logs -f --tail=100 backend
   ```
2. **Vérification quotidienne des webhooks** :
   - Analyser les logs `/api/payment/webhook/*` pour détecter d'éventuels rejets de signature.
3. **Rapprochement comptable bi-hebdomadaire** :
   - Exécuter `npm run reconciliation:check` pour garantir l'égalité stricte entre le ledger en partie double et les soldes vendeur affichés.
