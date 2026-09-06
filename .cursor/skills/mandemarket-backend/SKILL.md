---
name: mandemarket-backend
description: Développe le backend MandeMarket (Express, Prisma, Node.js). Routes API, logique métier, auth JWT, Cloudinary, Redis. Use when working on MandeMarket API, database schema, business logic, or backend services.
---

# MandeMarket - Agent Backend

## Stack

- **Framework** : Express.js 4.x
- **ORM** : Prisma
- **Validation** : Zod
- **Auth** : JWT (jsonwebtoken), bcrypt
- **Base** : PostgreSQL
- **Cache / broker** : Redis (selon usage)
- **Upload** : Multer + Cloudinary

## Répertoires clés

```
mandemarket/backend/
├── src/
│   ├── app.js                 # Point d’entrée, montage `/api/*`
│   ├── routes.*.js            # products, categories, auth, orders, …
│   ├── middleware.auth.js     # requireAuth, requireAdmin, requireSeller, …
│   └── services/              # cloudinary.service.js, …
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── scripts/                   # migrate.js, seed.js, …
└── Dockerfile
```

## Conventions

- Prix **en centimes** en base
- Valider les entrées (Zod ou équivalent sur les routes)
- `requireAuth` : utilisateur JWT back-office ; client : middlewares `account` / `customer` selon les routes
- Marketplace : modèles `Seller`, `SellerPayout`, champs `sellerId` sur `Product` et `OrderItem`

## Marketplace (schéma & routes)

### Prisma (extraits)

- `Seller` : boutique, slug, statut, `commissionRate`, etc.
- `Product.sellerId` optionnel (plateforme si `null`)
- `OrderItem` : commission et gains vendeur
- `SellerPayout` : versements

### Routes ` /api/sellers`

- Public : liste, profil par slug ou id
- `POST /register` : inscription vendeur (utilisateur connecté)
- `/me/*` : profil, produits, commandes, gains, demandes de payout
- `/admin/*` : modération vendeurs et payouts (admin)

Auth complémentaire : `POST /api/auth/signup-seller` (user + seller `pending`).
