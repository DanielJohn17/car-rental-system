car-rental-system/
├── apps/
│   ├── api/                            # NestJS backend – the heart of business logic & API
│   │   ├── prisma/                     # ← Neon + Prisma lives here
│   │   │   ├── schema.prisma           # main Prisma schema
│   │   │   ├── migrations/             # auto-generated
│   │   │   └── seed.ts                 # optional initial data
│   │   ├── src/
│   │   │   ├── common/                 # shared inside api only (filters, pipes, guards, interceptors)
│   │   │   ├── config/                 # configuration module (env validation)
│   │   │   ├── database/               # prisma service / connection wrapper
│   │   │   ├── modules/                # feature modules (auth, users, vehicles, bookings, ...) eg:- auth module, prisma module
│   │   │   ├── main.ts
│   │   │   └── app.module.ts
│   │   ├── test/                       # e2e + integration tests
│   │   ├── tsconfig.json
│   │   ├── nest-cli.json
│   │   └── package.json
