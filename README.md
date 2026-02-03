# Car Rental System

Monorepo containing:

- **API**: NestJS + TypeORM + Postgres (`apps/api`)
- **Web**: Next.js + Tailwind (`apps/web`)

For a short “just run it” guide, also see `STARTUP.md`.

## Prerequisites

- Node.js **18+**
- `pnpm`
- PostgreSQL (local install or Docker)

## Install

From repo root:

```bash
pnpm install
```

## Environment setup

This project uses two env files in development:

- `apps/api/.env` (NestJS API)
- `apps/web/.env.local` (Next.js web)

### 1) Backend (`apps/api/.env`)

Create `apps/api/.env`:

```env
# Database
# Either DATABASE_URL or DB_CONNECTION_STRING can be used
DATABASE_URL=postgresql://username:password@localhost:5432/car_rental
# DB_CONNECTION_STRING=postgresql://username:password@localhost:5432/car_rental

# Auth
JWT_SECRET=replace_me_with_a_long_random_string

# Public web URL (used to build Stripe success/cancel URLs)
WEB_APP_URL=http://localhost:3000

# Payments
COMMISSION_PERCENTAGE=10

# Stripe (optional; required for payment flows)
STRIPE_API_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_THIN_WEBHOOK_SECRET=whsec_...

# Stripe (optional; only for Connect demo / subscriptions)
STRIPE_ADMIN_ACCOUNT_ID=
STRIPE_STORE_APP_FEE_CENTS=123
STRIPE_SUBSCRIPTION_PRICE_ID=price_...

# Email (optional)
RESEND_API_KEY=
EMAIL_FROM=noreply@carrental.com
```

Notes:

- **Use `localhost`** for local development. If you point this to a remote IP/host that is not reachable, the API will fail to start.
- The API reads env from `apps/api/.env` first (and falls back to a root `.env` if you have one).

Minimal backend env (just to boot locally):

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/car_rental
JWT_SECRET=dev_secret
WEB_APP_URL=http://localhost:3000
```

### 2) Frontend (`apps/web/.env.local`)

Create `apps/web/.env.local`:

```env
# Backend API base URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000

# Cloudinary (optional; required for image upload UI)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

Minimal web env (works without Cloudinary uploads):

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

## Database setup

### Option A: Local Postgres

Create a database named `car_rental` and update `DATABASE_URL` accordingly.

### Option B: Docker Postgres

```bash
docker run --name car-rental-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=car_rental \
  -p 5432:5432 \
  -d postgres:16
```

Then set:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/car_rental
```

## Run (development)

### Option A: Run services separately

API:

```bash
pnpm -C apps/api dev
```

Web:

```bash
pnpm -C apps/web dev
```

### Option B: Run everything with Turbo

```bash
pnpm dev
```

## URLs

- Web: `http://localhost:3000`
- API: `http://localhost:5000`
- API docs (Swagger): `http://localhost:5000/api/docs`

## Useful commands

```bash
# Web
pnpm -C apps/web check-types
pnpm -C apps/web build

# API
pnpm -C apps/api build
pnpm -C apps/api start:prod
```

## Troubleshooting

### API won’t start / DB connection errors (`ETIMEDOUT`, `ECONNREFUSED`)

Check:

- `apps/api/.env` has a correct `DATABASE_URL` (or `DB_CONNECTION_STRING`).
- Postgres is running and reachable from the machine running the API.
- The host/port in the URL are correct (for local dev: `localhost:5432`).

### Web can’t reach API

Check:

- API is running on port `5000`
- `apps/web/.env.local` has `NEXT_PUBLIC_API_BASE_URL=http://localhost:5000`

### Image upload doesn’t work

Cloudinary variables must be set in `apps/web/.env.local`:

- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`

