# CAD Point CRM

Production-ready CRM for CAD Point training institute. This repository contains a React (Vite) frontend and Node.js + Express backend with PostgreSQL (Prisma) persistence.

Requirements
- Node 22
- PostgreSQL 14+

Quick start (development)

Client
```bash
cd client
npm ci
npm run dev
```

Server
```bash
cd server
npm ci
cp .env.example .env
# Edit .env and set DATABASE_URL and JWT_SECRET
npm run dev
```

Default ports
- Client: http://localhost:3000
- API: http://localhost:5001

Frontend API configuration
- Use `VITE_API_URL` (see `client/.env.example`) to point the frontend to the backend API, e.g. `VITE_API_URL=http://localhost:5001/api`.

For production build and deployment see `PRODUCTION.md` and `docs/`.
