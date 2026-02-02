car-rental-system/
├── apps/
│ ├── api/ # NestJS backend – the heart of business logic & API
│ │ ├── prisma/ # ← Neon + Prisma lives here
│ │ │ ├── schema.prisma # main Prisma schema
│ │ │ ├── migrations/ # auto-generated
│ │ │ └── seed.ts # optional initial data
│ │ ├── src/
│ │ │ ├── common/ # shared inside api only (filters, pipes, guards, interceptors)
│ │ │ ├── config/ # configuration module (env validation)
│ │ │ ├── database/ # prisma service / connection wrapper
│ │ │ ├── modules/ # feature modules (auth, users, vehicles, bookings, ...) eg:- auth module, prisma module
│ │ │ ├── main.ts
│ │ │ └── app.module.ts
│ │ ├── test/ # e2e + integration tests
│ │ ├── tsconfig.json
│ │ ├── nest-cli.json
│ │ └── package.json

## Updated Next.js Structure (in apps/dashboard/ – Now Hybrid Public/Protected)

Split routes: public for customers, protected (/admin) for internal users.

apps/dashboard/
├── app/
│ ├── (public)/ # Anonymous customer routes – no auth
│ │ ├── vehicles/ # Search/list with filters
│ │ │ ├── page.tsx
│ │ │ └── [id]/page.tsx # Vehicle detail + booking form
│ │ ├── bookings/ # Public booking create (form + Stripe)
│ │ │ └── new/page.tsx
│ │ └── confirmation/[ref]/page.tsx # Post-payment success
│ ├── (admin)/ # Protected – login required
│ │ ├── login/page.tsx # Login form
│ │ ├── register/page.tsx # Admin-only? Or self-register with approval
│ │ ├── dashboard/page.tsx # Role-based overview
│ │ ├── users/ # Admin: manage sales team
│ │ │ └── page.tsx
│ │ ├── vehicles/ # Admin: CRUD vehicles
│ │ │ └── page.tsx
│ │ ├── bookings/ # Sales: pending list, approve/reject
│ │ │ └── page.tsx
│ │ └── maintenance/ # Sales: report
│ │ └── page.tsx
│ ├── api/ # Route handlers if needed (e.g., Stripe webhook proxy?)
│ ├── layout.tsx # Global (auth check for /admin)
│ └── page.tsx # Root redirect to /vehicles
├── components/
│ ├── ui/ # shadcn (filters, forms, tables for bookings/vehicles)
│ ├── public/ # Customer-specific (search form, date picker, Stripe elements)
│ └── admin/ # Internal (user management, approval buttons)
├── lib/
│ └── auth.ts # Auth utils (JWT check for protected routes)
└── … (unchanged: hooks, styles, etc.)
