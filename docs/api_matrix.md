# Matrice des Endpoints et Pages MandeMarket

Matrice établie pour la traçabilité des contrats d'interface (section 5 de `PLAN_FINALISATION.md`).

---

## 1. Authentification & Sessions

| Endpoint Backend | Méthode | Rôle requis | Page Frontend associée | Statut |
|---|---|---|---|---|
| `/api/auth/signup` | POST | Public | `/compte` (Onglet Inscription) | À sécuriser |
| `/api/auth/login` | POST | Public | `/compte`, `/admin/login`, `/vendeur/login` | À sécuriser |
| `/api/auth/refresh` | POST | Authentifié | Toutes pages (Intercepteur Axios/Fetch) | À créer |
| `/api/auth/logout` | POST | Authentifié | Header / Menu utilisateur | À sécuriser |
| `/api/auth/logout-all`| POST | Authentifié | `/compte/securite` | À créer |
| `/api/auth/forgot-password` | POST | Public | `/mot-de-passe-oublie` | À créer |
| `/api/auth/reset-password` | POST | Public | `/reinitialiser-mot-de-passe` | À créer |
| `/api/auth/me` | GET | Authentifié | Header, Profil, Dashboards | Existant |
| `/api/auth/sessions` | GET, DELETE | Authentifié | `/compte/securite` | À créer |

---

## 2. Devis, Panier & Commandes

| Endpoint Backend | Méthode | Rôle requis | Page Frontend associée | Statut |
|---|---|---|---|---|
| `/api/checkout/quote` | POST | Public / Auth | `/panier`, `/checkout` | **À créer (P0)** |
| `/api/orders/checkout` | POST | Public / Auth | `/checkout` | **À refaire (P0)** |
| `/api/orders/:ref/status` | GET | Public avec token ou Auth | `/commande/confirmation/[ref]` | **À créer (P0)** |
| `/api/orders/my-orders` | GET | Client | `/compte/commandes` | À brancher |
| `/api/orders/:id/cancel` | POST | Client / Admin | `/compte/commandes/[id]` | À créer |

---

## 3. Paiements & Webhooks

| Endpoint Backend | Méthode | Rôle requis | Page Frontend associée | Statut |
|---|---|---|---|---|
| `/api/payments/initialize` | POST | Client | `/checkout` | À unifier |
| `/api/payments/verify/:reference` | GET | Client | `/paiement/statut` | À refaire |
| `/api/webhooks/cinetpay` | POST | Public (HMAC vérifié) | N/A (Serveur à Serveur) | À sécuriser (P0) |
| `/api/webhooks/paystack` | POST | Public (Signature vérifiée) | N/A (Serveur à Serveur) | À sécuriser (P0) |
| `/api/webhooks/stripe` | POST | Public (Signature vérifiée) | N/A (Serveur à Serveur) | À sécuriser (P0) |

---

## 4. Espace Vendeur & Ledger

| Endpoint Backend | Méthode | Rôle requis | Page Frontend associée | Statut |
|---|---|---|---|---|
| `/api/sellers/register` | POST | Utilisateur | `/devenir-vendeur` | Existant |
| `/api/sellers/me/profile` | GET, PUT | Vendeur | `/vendeur/parametres` | À finaliser |
| `/api/sellers/me/products` | GET, POST | Vendeur | `/vendeur/produits` | À sécuriser |
| `/api/sellers/me/products/:id` | PUT, DELETE | Vendeur | `/vendeur/produits/[id]` | À brancher |
| `/api/sellers/me/orders` | GET | Vendeur | `/vendeur/commandes` | À sécuriser |
| `/api/sellers/me/balance` | GET | Vendeur | `/vendeur/finances` | **À créer (P0)** |
| `/api/sellers/me/ledger` | GET | Vendeur | `/vendeur/finances` | **À créer (P0)** |
| `/api/sellers/me/payouts` | GET, POST | Vendeur | `/vendeur/finances` | **À créer (P0)** |

---

## 5. Administration

| Endpoint Backend | Méthode | Rôle requis | Page Frontend associée | Statut |
|---|---|---|---|---|
| `/api/admin/users` | GET, POST | Admin | `/admin/utilisateurs` | À brancher |
| `/api/admin/users/:id/status`| PUT | Admin | `/admin/utilisateurs` | À créer |
| `/api/admin/sellers` | GET | Admin / Manager | `/admin/vendeurs` | Existant |
| `/api/admin/sellers/:id/approve` | POST | Admin | `/admin/vendeurs` | Existant |
| `/api/admin/payouts` | GET | Admin / Manager | `/admin/finances` | **À créer (P0)** |
| `/api/admin/payouts/:id/process` | POST | Admin | `/admin/finances` | **À créer (P0)** |
| `/api/admin/payouts/:id/fail` | POST | Admin | `/admin/finances` | **À créer (P0)** |
| `/api/admin/audit-logs` | GET | Admin | `/admin/securite` | **À créer (P1)** |
