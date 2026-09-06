# Cloudinary — MandeMarket

Le backend charge et sert les images produits via **Cloudinary** (upload Multer + SDK). Sans clés valides, l’upload peut échouer ou rester limité selon la configuration.

## Variables d’environnement (backend)

À définir dans `backend/.env` ou `backend/.env.docker` :

| Variable | Description |
|----------|-------------|
| `CLOUDINARY_CLOUD_NAME` | Nom du cloud (console Cloudinary) |
| `CLOUDINARY_API_KEY` | Clé API |
| `CLOUDINARY_API_SECRET` | Secret API |

Console : [https://cloudinary.com/console](https://cloudinary.com/console)

## Frontend

Le composant `frontend/app/components/CloudinaryImageUpload.tsx` gère l’upload côté UI ; la clé publique n’est pas toujours obligatoire si l’upload passe uniquement par l’API. Pour une config navigateur directe, vous pouvez ajouter `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` dans `frontend/.env.local` (voir commentaires dans `frontend/.env.example`).

## Fichiers utiles

- Service : `backend/src/services/cloudinary.service.js`
- Route upload produits : `POST /api/products/upload` (`backend/src/routes.product.js`)

## Bonnes pratiques

- Ne jamais committer les secrets ; utiliser les fichiers `.env*` locaux ou un gestionnaire de secrets en production.
- Vérifier les quotas et les transformations (format, taille) dans la console Cloudinary.

---

*Documentation alignée sur le dépôt — 1ᵉʳ mai 2026.*
