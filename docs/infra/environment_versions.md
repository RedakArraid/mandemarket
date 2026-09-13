# Inventaire des Versions Logicielles (MM-INF-001)

Date du relevé : 13 Septembre 2026
Branche de travail : `feature/finalisation-production`

## 1. Environnement Hôte (Développement / Exécution)

| Composant | Version | Détails |
|---|---|---|
| **OS** | macOS (Darwin arm64) | Apple Silicon |
| **Node.js** | v20.19.0 | LTS |
| **npm** | 10.8.2 | Gestionnaire de paquets |
| **Docker Engine** | 29.2.1 (build a5c7197) | Moteur de conteneurs |
| **Docker Compose** | v5.1.0 | Orchestrateur local |
| **Prisma CLI** | 5.22.0 | Moteur de schémas et migrations |
| **@prisma/client** | 5.22.0 | Client d'accès base de données |

---

## 2. Conteneurs Docker de Référence

| Service Docker | Image | Version | Ports hôte -> conteneur |
|---|---|---|---|
| **mandemarket-postgres** | `postgres:16-alpine` | PostgreSQL 16.15 | `5433:5432` |
| **mandemarket-redis** | `redis:7-alpine` | Redis 7.x | `6380:6379` |
| **mandemarket-backend** | `mandemarket-backend` (Node 18 Alpine base) | Express 4.18.2 | `4002:4002` |
| **mandemarket-frontend** | `mandemarket-frontend` (Node 18 Alpine base) | Next.js 14.0.4 | `3000:3000` |
| **mandemarket-adminer** | `adminer:latest` | Dernière | `8080:8080` |

---

## 3. Dépendances Critiques Backend

- `express` : `^4.18.2`
- `prisma` / `@prisma/client` : `5.22.0` (installé), `^5.7.1` (dans package.json)
- `bcryptjs` : `^2.4.3`
- `jsonwebtoken` : `^9.0.2`
- `zod` : `^3.22.4`
- `stripe` : `^14.18.0`

## 4. Dépendances Critiques Frontend

- `next` : `^14.0.4`
- `react` / `react-dom` : `^18.2.0`
- `typescript` : `^5.3.3`
- `tailwindcss` : `^3.4.0`
- `@tanstack/react-query` : `^5.83.0`
