# SmartCampus - Setup initial

Ce dépôt contient uniquement le setup technique initial :

- Frontend : Vue 3 + Vite + Vue Router + TypeScript + Vitest
- Backend : Hono + TypeScript sur Node.js + Vitest
- Base de données : PostgreSQL (Docker Compose)
- ORM : Drizzle ORM + drizzle-kit

## Prérequis

- Node.js 20+
- npm
- Docker + Docker Compose

## 1) Installer les dépendances

```bash
cd frontend
npm install
cd ..
cd backend
npm install
cd ..
```

## 2) Variables d'environnement

Copier `.env.example` vers `.env` à la racine :

```bash
Copy-Item .env.example .env
```

Puis ajuster `DATABASE_URL` selon votre environnement PostgreSQL.

## 3) Démarrer PostgreSQL

```bash
docker compose up -d
```

## 4) Démarrer le backend

```bash
cd backend
npm run dev
```

API disponible sur `http://localhost:3000` :
- `GET /api/health`

## 5) Démarrer le frontend

```bash
cd frontend
npm run dev
```

Le frontend tourne sur Vite et appelle `/api/health` via le proxy Vite vers `http://localhost:3000`.

## Tests

Backend :

```bash
cd backend
npm test
```

Frontend :

```bash
cd frontend
npm test
```

Projet réalisé dans le cadre du TP DevOps, ENSA Khouribga.
