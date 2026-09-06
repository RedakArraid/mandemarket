---
name: mandemarket-infra
description: Gère l'infrastructure MandeMarket (Docker, Traefik, déploiement). docker-compose.prod.yml, Dockerfiles, labels Traefik, volumes, healthchecks. Use when deploying MandeMarket, modifying Docker config, or Traefik routing.
---

# MandeMarket - Agent Infra

## Contexte

- **Projet** : dépôt `mandemarket` (racine du clone, ex. `~/mandemarket`)
- **Production** : souvent déployé derrière **Traefik** (`docker-compose.prod.yml`, réseau externe type `traefik_network`)
- **Production VPS 1** : `mandemarket.soubadigital.com`, `apimandemarket.soubadigital.com` (`vps-contabo`, IP `178.238.229.159`)
- **Ancien hébergement** : `mandemarket.soubadigital.com`, `apimandemarket.soubadigital.com` (DNS NXDOMAIN)

## Fichiers clés

```
mandemarket/
├── docker-compose.prod.yml   # Services prod
├── backend/Dockerfile
├── frontend/Dockerfile
├── .env.production
└── env.production.example
```

## Services Docker

| Service | Port | Traefik |
|---------|------|---------|
| mandemarket-frontend | 3001 | Host(mandemarket.soubadigital.com) |
| mandemarket-backend | 4002 | Host(apimandemarket.soubadigital.com) |
| mandemarket-db | 5432 | interne |
| mandemarket-redis | 6379 | interne |

## Commandes

```bash
# Démarrer
docker compose -f mandemarket/docker-compose.prod.yml --project-name mandemarket-prod --env-file mandemarket/.env.production up -d

# Rebuild
docker compose -f mandemarket/docker-compose.prod.yml --project-name mandemarket-prod up -d --build

# Logs
docker compose -f mandemarket/docker-compose.prod.yml --project-name mandemarket-prod logs -f
```

## Volumes externes

- root_mandemarket_postgres_data
- root_mandemarket_redis_data
- root_mandemarket_backend_uploads
- root_mandemarket_backend_logs

## Règles

- Ne pas modifier le docker-compose racine (Traefik) sans coordination
- Les labels Traefik doivent rester cohérents avec les autres projets
- Healthchecks obligatoires sur frontend et backend
- Variables sensibles dans .env.production (jamais committées)
