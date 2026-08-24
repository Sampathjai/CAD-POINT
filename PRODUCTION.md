# CAD Point CRM — Production Build

This package is the production-stage foundation for the CAD Point CRM.

## Architecture
- Next.js frontend target
- Node.js/Express API
- PostgreSQL + Prisma
- RBAC authentication
- Rate limiting/security headers
- Background job/integration boundaries
- Version-controlled migrations
- Docker local infrastructure

## Core business modules
Leads, counsellors, follow-ups, WhatsApp, courses, batches, students, admissions, attendance, certificates, payments, notifications, reports, users and audit logs.

## Database rule
Development: `npx prisma migrate dev`

Staging/production: `npx prisma migrate deploy`

Never use `prisma migrate reset` against production.

## Start API
`cd server`
`npm install`
`npx prisma generate`
`npm run dev`

## Frontend
The existing UI is retained as the current client. Before production release, it should be migrated/validated against a Next.js App Router build with separate staging and production environment variables.
