---
name: mandemarket-frontend
description: Développe le frontend MandeMarket (Next.js 14, React, TypeScript, Tailwind). Pages boutique, admin, espace vendeur, composants, contextes React. Use when working on MandeMarket UI, React components, Next.js pages, or frontend integration.
---

# MandeMarket - Agent Frontend

## Stack

- **Framework** : Next.js 14 (App Router)
- **Langage** : TypeScript
- **Styling** : Tailwind CSS
- **État** : React Context (StoreContext, CartContext, etc.)
- **API** : fetch vers `NEXT_PUBLIC_API_URL` ; SSR possible via `INTERNAL_API_URL` sous Docker

## Répertoires clés

```
mandemarket/frontend/
├── app/
│   ├── page.tsx, layout.tsx
│   ├── boutique/           # Catalogue & fiche produit
│   ├── panier/, checkout/
│   ├── compte/             # Client (login, commandes…)
│   ├── vendeur/            # Espace vendeur + page publique [slug]
│   ├── devenir-vendeur/
│   ├── admin/              # Admin + dashboard
│   ├── components/
│   ├── contexts/
│   ├── config/             # api.ts, analytics, devise
│   └── …                   # blog, contact, mentions légales, CGV
├── types/
└── Dockerfile
```

## Conventions

- Prix **en centimes** côté API ; affichage FCFA via les utilitaires du projet
- Composants fonctionnels + hooks
- Préférer les types partagés dans `frontend/types` (ou chemins équivalents du repo)
- Upload images : `CloudinaryImageUpload` + API backend

## Marketplace (implémenté côté routes)

- Pages vendeur : `/vendeur`, `/devenir-vendeur`, `/vendeur/dashboard`, `/vendeur/[slug]`
- Panier multi-vendeurs et intégration checkout selon `CartContext` / flux API

## API utiles (consommation)

- `GET/POST /api/products` (filtres query dont vendeur si exposé)
- `GET /api/sellers`, `GET /api/sellers/slug/:slug`
- `POST /api/sellers/register` (JWT utilisateur) ou `POST /api/auth/signup-seller`
- `GET /api/sellers/me/*` (dashboard vendeur, authentifié)
