# PostgreSQL + Prisma setup

1. Install PostgreSQL and create a database:
   `createdb cadpoint_crm`
2. In `server`, copy `.env.example` to `.env`.
3. Set `DATABASE_URL` to your PostgreSQL connection string.
4. Run:
   `npm install`
   `npx prisma generate`
   `npx prisma migrate dev --name init`
   `npm run prisma:seed`
5. Start:
   `npm run dev`

Seed login:
- Email: admin@cadpoint.com
- Password: Admin@123

Change the password and JWT secret before production.
