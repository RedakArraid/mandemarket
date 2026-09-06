# MandeMarket — Marketplace

## Vue d’ensemble

MandeMarket est une **marketplace** : plusieurs vendeurs peuvent proposer des produits ; la plateforme applique une **commission** configurable par vendeur.

## Fonctionnalités

### Pour les vendeurs

- **Présentation** : `/vendeur`
- **Devenir vendeur** : `/devenir-vendeur`
- **Tableau de bord** : `/vendeur/dashboard` (produits dédiés : `/vendeur/dashboard/produits`)
- **Profil public** : `/vendeur/[slug]`

### Pour les acheteurs

- **Panier multi-vendeurs** : regroupement des articles par vendeur
- **Filtre vendeur** : `GET /api/products?sellerId=...` (selon implémentation des query params côté API)

### Pour l’administrateur

- Gestion des vendeurs (approbation / suspension, commission)
- Suivi des versements (`SellerPayout`, routes admin vendeurs)

## Modèle de données (Prisma)

- **Seller** : `storeName`, `slug`, `status` (`pending` / `approved` / `suspended`), `commissionRate`, etc.
- **Product.sellerId** : `null` = produit plateforme ; sinon lien vers un vendeur
- **OrderItem** : `sellerId`, `commissionAmount`, `sellerEarnings`
- **SellerPayout** : demandes et historique des versements

## API vendeurs (`/api/sellers`)

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/` | Liste des vendeurs (profils publics / filtrés) |
| GET | `/slug/:slug` | Profil par slug |
| GET | `/:id` | Détail par id |
| POST | `/register` | Inscription vendeur (JWT utilisateur requis) |
| GET | `/me/status` | Statut du compte vendeur pour l’utilisateur connecté |
| GET | `/me/profile` | Profil vendeur (connecté, vendeur approuvé) |
| PUT | `/me/profile` | Mise à jour du profil |
| GET | `/me/products` | Produits du vendeur |
| GET | `/me/orders` | Commandes concernant le vendeur |
| GET | `/me/earnings` | Revenus |
| POST | `/me/payouts/request` | Demande de versement |
| GET | `/me/payouts` | Historique des versements |
| GET | `/admin/all` | Tous les vendeurs (admin) |
| GET | `/admin/payouts` | Versements (admin) |
| PUT | `/admin/payouts/:id` | Traiter un versement (admin) |
| PUT | `/admin/:id/approve` | Approuver / suspendre (admin) |

Inscription alternative côté auth : `POST /api/auth/signup-seller`.

## Migrations

```bash
cd backend
npx prisma migrate deploy
```

Sous Docker, les migrations sont en général exécutées au démarrage du backend ou via `npm run docker:migrate` à la racine du monorepo.

## Agents Cursor

Voir [AGENTS.md](./AGENTS.md) pour l’organisation Manager / Frontend / Backend / Infra.

---

*Documentation alignée sur le code — 1ᵉʳ mai 2026.*
