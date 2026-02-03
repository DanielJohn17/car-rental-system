# Refactoring Plan - Scope Change Implementation

## Summary of Changes

### Before (Old Scope)

- Customer authentication (register/login)
- Customer profiles with verification
- Full payment handling
- Customer booking history

### After (New Scope)

- **No customer authentication** - completely anonymous
- **Admin-only authentication** - admin/sales staff login
- **10% deposit only** - via Stripe
- **Guest bookings** - minimal info (phone required)

---

## Module Changes Required

### 1. Auth Module

**Changes:**

- ❌ Remove `RegisterDto`, `register()` endpoint (customer registration)
- ✅ Keep `LoginDto`, `login()` endpoint (admin/sales login only)
- ✅ Add role-based authentication (ADMIN | SALES)
- ✅ Keep refresh token functionality
- ✅ Keep JWT strategy and guards

**Endpoints:**

```
POST   /auth/login        (email/password for admin/sales)
POST   /auth/refresh      (refresh access token)
POST   /auth/logout       (logout)
GET    /auth/me           (current user profile)
```

---

### 2. Users Module

**Changes:**

- ❌ Remove CustomerProfile entity entirely
- ✅ User entity now only for admin/sales staff
- ✅ Admin can CRUD sales team members
- ✅ Add role-based endpoints

**Endpoints:**

```
POST   /users             (admin creates sales member)
GET    /users             (admin lists all staff)
GET    /users/:id         (admin/sales views staff profile)
PUT    /users/:id         (admin edits staff profile)
DELETE /users/:id         (admin removes staff member)
GET    /users/me          (staff views own profile)
```

---

### 3. Vehicles Module

**Changes:**

- ✅ Keep entity structure (make, model, dailyRate, location, status, etc.)
- ✅ Add public endpoints for search/filter (no auth required)
- ✅ Add admin/sales CRUD endpoints (auth required)

**Endpoints:**

```
GET    /vehicles                    (public: list & filter)
GET    /vehicles/:id                (public: vehicle details)
GET    /vehicles/search/availability (public: check availability)
POST   /vehicles                    (admin only: create)
PUT    /vehicles/:id                (admin only: edit)
DELETE /vehicles/:id                (admin only: delete)
PATCH  /vehicles/:id/status         (admin/sales: update status)
```

---

### 4. Locations Module

**Changes:**

- ✅ Keep entity structure
- ✅ Public list endpoint (for booking search)
- ✅ Admin CRUD endpoints

**Endpoints:**

```
GET    /locations                   (public: list all)
GET    /locations/:id               (public: location details)
POST   /locations                   (admin only)
PUT    /locations/:id               (admin only)
DELETE /locations/:id               (admin only)
```

---

### 5. Bookings Module

**Changes:**

- ✅ Create Booking entity for guest/anonymous bookings
- ✅ Public create endpoint (no auth)
- ✅ Sales/admin endpoints for approval, rejection, status updates

**Fields:**

```
guestName, guestPhone (required), guestEmail, vehicleId,
startDate, endDate, pickupLocationId, totalPrice, depositAmount,
status (PENDING|APPROVED|REJECTED|COMPLETED),
stripePaymentId, approvedBy (FK to User), notes
```

**Endpoints:**

```
POST   /bookings                    (public: create guest booking)
GET    /bookings/:id                (public: get booking details)
GET    /bookings                    (sales/admin: list bookings)
PUT    /bookings/:id/approve        (sales/admin: approve)
PUT    /bookings/:id/reject         (sales/admin: reject)
PUT    /bookings/:id/status         (sales/admin: update status)
```

---

### 6. Pricing Module

**Changes:**

- ✅ Public endpoint to calculate rental price + 10% deposit

**Endpoints:**

```
POST   /pricing/calculate           (public: calculate price & deposit)
```

**Request:**

```json
{
  "vehicleId": "uuid",
  "startDate": "2024-01-15",
  "endDate": "2024-01-20"
}
```

**Response:**

```json
{
  "dailyRate": 100,
  "days": 5,
  "subtotal": 500,
  "deposit": 50,
  "total": 550
}
```

---

### 7. Payments Module

**Changes:**

- ✅ Create Stripe PaymentIntent for deposits only
- ✅ Webhook handling for payment confirmation
- ✅ Sales/admin view payment status

**Endpoints:**

```
POST   /payments/intent             (public: create payment intent)
POST   /payments/webhook            (stripe webhook)
GET    /payments/booking/:id        (sales/admin: payment status)
```

---

### 8. Notifications Module

**Changes:**

- ✅ Send confirmation email to guest (guestEmail)
- ✅ Send approval/rejection email to guest
- ✅ Optional SMS to guestPhone (future)

---

### 9. Dashboard Module

**Changes:**

- ✅ Sales/admin only endpoints
- ✅ Overview stats (pending bookings, fleet status, revenue)

**Endpoints:**

```
GET    /dashboard/stats             (sales/admin: overview)
GET    /dashboard/pending-bookings  (sales/admin: pending list)
GET    /dashboard/fleet-status      (sales/admin: vehicle status)
```

---

### 10. MaintenanceRecord Module (NEW)

**Changes:**

- ✅ Create new entity for maintenance/damage tracking
- ✅ Sales/admin can create and view records

**Fields:**

```
vehicleId, date, type (SERVICE|REPAIR|INSPECTION),
cost, notes, reportedBy (FK to User)
```

**Endpoints:**

```
POST   /maintenance                 (sales/admin: create)
GET    /maintenance                 (sales/admin: list)
GET    /maintenance/vehicle/:id     (sales/admin: vehicle history)
```

---

## Entity Changes Summary

### Delete

- ❌ `CustomerProfile` (no customer profiles)

### Modify

- **User**: Remove email/password validation for customers, keep only for staff
- **Booking**: Add guest fields (guestName, guestPhone, guestEmail), remove userId foreign key

### Create

- ✅ `MaintenanceRecord`: For vehicle maintenance tracking
- ✅ `DamageReport`: For damage tracking (Phase 2)

---

## Guard & Role Setup

### JwtGuard

- Validates JWT tokens (existing)

### RoleGuard (NEW)

```typescript
@UseGuards(JwtGuard, new RoleGuard(['ADMIN', 'SALES']))
async someEndpoint() { ... }
```

---

## Environment Variables Needed

```
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
DATABASE_URL=postgresql://...
```

---

## Migration Notes

1. Existing User entities with role=CUSTOMER should be deleted or migrated
2. CustomerProfile entities should be deleted
3. Existing Booking entities need to be updated to add guest fields
4. Create new indices on guestPhone for fast lookup (sales team needs this)
