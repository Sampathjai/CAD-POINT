Testing integration guide

1) Start test Postgres via docker-compose:

```bash
docker compose -f docker-compose.test.yml up -d
```

2) Export test DATABASE_URL and push schema + seed:

```bash
export DATABASE_URL="postgres://cadtest:cadtest@localhost:5433/cadpoint_test"
cd server
npx prisma db push --schema=./prisma/schema.prisma
node prisma/seed.js
npm run start & # start server (or run in separate terminal)
```

3) Run integration tests:

```bash
export TEST_API_URL=http://localhost:5001/api
cd server
npm run test:integration

Helper script:

You can run the whole flow (docker up, push schema, seed, start server, run tests, teardown) with the helper:

```bash
./scripts/run-integration-local.sh
```
```

Notes:
- CI should run the same steps but start server in CI and ensure port availability.
- The seed creates `admin@cadpoint.com` / `Admin@123` for tests.
