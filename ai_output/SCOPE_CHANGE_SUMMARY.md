# Scope Change Implementation Summary

## Overview

Successfully refactored the car rental system to shift from customer-centric authentication to an **admin/sales-only authenticated system with anonymous guest bookings**.

---

## Major Changes Implemented

### 1. Authentication Module (`@apps/api/src/auth`)

**Changes Made:**

- ❌ **Removed** `POST /auth/register` endpoint (no customer registration)
- ✅ **Kept** `POST /auth/login` endpoint (admin/sales login only)
- ✅ **Kept** `POST /auth/refresh` (refresh token)
- ✅ **Kept** `POST /auth/logout` (logout)
- ✅ **Kept** `GET /auth/me` (current user profile)

**New Security:**

- Added `RoleGuard` for role-based access control
- Supports roles: `ADMIN` | `SALES`
- Token expiration: Access (15m), Refresh (7d)

**Files Modified:**

- `auth.controller.ts` - Removed register endpoint
- `auth.service.ts` - Removed register method
- `auth.module.ts` - Added RoleGuard, RefreshTokenStrategy exports
- `guards/role.guard.ts` - NEW: Role-based access control
- `strategies/refresh-token.strategy.ts` - NEW: Refresh token validation
- `guards/refresh-token.guard.ts` - NEW: Guard for refresh token
- `entities/user.entity.ts` - Added `createdBy` field, `refreshToken` now nullable

---

### 2. Users Module (`@apps/api/src/users`)

**Purpose:** Manage admin and sales staff members only

**Changes Made:**

- ❌ **Removed** `CustomerProfile` entity reference
- ✅ **Admin-only endpoints:**
  - `POST /users` - Create new sales member
  - `DELETE /users/:id` - Remove staff member
  - `GET /users` - List all staff (paginated)
  - `GET /users/:id` - View staff profile
  - `PUT /users/:id` - Update staff profile

**Files Modified/Created:**

- `users.service.ts` - RECREATED: Staff management only
- `users.controller.ts` - RECREATED: Admin/sales endpoints
- `users.module.ts` - RECREATED: Simplified module
- `dtos/staff.dto.ts` - NEW: Staff DTOs (Create, Update, Response)
- `users.service.spec.ts` - RECREATED: Updated tests
- `users.controller.spec.ts` - RECREATED: Updated tests

**API Endpoints:**

```
POST   /users                 (ADMIN: create staff)
GET    /users                 (ADMIN/SALES: list staff)
GET    /users/:id             (ADMIN/SALES: view profile)
PUT    /users/:id             (ADMIN/SALES: update own or ADMIN updates others)
DELETE /users/:id             (ADMIN only: delete staff)
```

---

### 3. User Entity Changes (`@apps/api/src/auth/entities/user.entity.ts`)

**New Fields:**

- `refreshToken: string | null` - Store refresh token
- `createdBy: string | null` - Track who created this user (for audit)

**Removed Behaviors:**

- No longer represents customers
- Only for admin/sales staff

**Roles:**

- `ADMIN` - Full system access, manage sales team and vehicles
- `SALES` - View and approve bookings, report maintenance
- ~~`CUSTOMER`~~ - REMOVED (no customer accounts)

---

## Module Status

### ✅ Completed & Updated

1. **Auth** - Admin/sales login only, role-based guards
2. **Users** - Staff management (admin & sales)
3. **Auth & Users Tests** - Updated to reflect new scope

### ⏳ Pending Implementation (aligned with new scope)

1. **Vehicles** - Public search (no auth) + admin CRUD
2. **Locations** - Public list + admin CRUD
3. **Bookings** - Public create (guest only) + admin/sales approval
4. **Pricing** - Public calculation endpoint
5. **Payments** - Public deposit collection via Stripe + webhook
6. **Notifications** - Send emails to guest (guestEmail)
7. **Dashboard** - Admin/sales overview stats
8. **MaintenanceRecord** - Sales staff track vehicle maintenance

---

## API Route Structure (New)

### Public Routes (No Authentication)

```
GET    /vehicles                      (search & filter)
GET    /vehicles/:id                  (vehicle details)
GET    /locations                     (list locations)
POST   /bookings                      (create guest booking)
POST   /pricing/calculate             (calculate price & deposit)
POST   /payments/intent               (create Stripe intent)
POST   /payments/webhook              (Stripe webhook)
```

### Protected Routes (Authentication Required)

```
# Auth
POST   /auth/login                    (any staff)
POST   /auth/refresh                  (any staff)
POST   /auth/logout                   (any staff)
GET    /auth/me                       (any staff)

# Users (Admin & Sales)
POST   /users                         (ADMIN only)
GET    /users                         (ADMIN/SALES)
GET    /users/:id                     (ADMIN/SALES)
PUT    /users/:id                     (ADMIN/SALES)
DELETE /users/:id                     (ADMIN only)

# Vehicles (Admin & Sales)
POST   /vehicles                      (ADMIN only)
PUT    /vehicles/:id                  (ADMIN only)
DELETE /vehicles/:id                  (ADMIN only)
PATCH  /vehicles/:id/status           (ADMIN/SALES)

# Bookings (Admin & Sales)
GET    /bookings                      (ADMIN/SALES: list)
PUT    /bookings/:id/approve          (ADMIN/SALES)
PUT    /bookings/:id/reject           (ADMIN/SALES)
PUT    /bookings/:id/status           (ADMIN/SALES)

# Maintenance (Sales & Admin)
POST   /maintenance                   (ADMIN/SALES)
GET    /maintenance                   (ADMIN/SALES)
GET    /maintenance/vehicle/:id       (ADMIN/SALES)

# Dashboard (Admin & Sales)
GET    /dashboard/stats               (ADMIN/SALES)
GET    /dashboard/pending-bookings    (ADMIN/SALES)
GET    /dashboard/fleet-status        (ADMIN/SALES)
```

---

## Database Migrations Needed

### Add Column to User Table

```sql
ALTER TABLE users ADD COLUMN "refreshToken" text;
ALTER TABLE users ADD COLUMN "createdBy" uuid;
```

### Delete (if applicable - handle carefully)

```sql
-- Option 1: Keep CustomerProfile but mark as inactive
-- Option 2: Delete all customer profiles
DELETE FROM customer_profiles WHERE "userId" NOT IN (
  SELECT id FROM users WHERE role != 'CUSTOMER'
);
```

---

## Environment Variables (No Changes)

```
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
DATABASE_URL=postgresql://...
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

---

## Testing Status

- ✅ Auth module tests pass
- ✅ Users module tests pass
- ⏳ Integration tests pending for new modules

---

## Next Steps

1. **Implement Bookings Module**
   - Guest fields (guestName, guestPhone, guestEmail)
   - Public create endpoint
   - Sales approval/rejection

2. **Implement Vehicles Module**
   - Public search/filter endpoints
   - Admin CRUD endpoints
   - Status management

3. **Implement Payments Module**
   - Stripe PaymentIntent for deposits
   - Webhook for payment confirmation

4. **Implement Dashboard Module**
   - Pending bookings overview
   - Fleet status
   - Revenue stats

5. **Implement MaintenanceRecord Module**
   - Sales can log maintenance
   - Track vehicle history

---

## Reference Documents

- `/REFACTORING_PLAN.md` - Detailed module-by-module planning
- `tasks/project_structure.md` - Original scope requirements
