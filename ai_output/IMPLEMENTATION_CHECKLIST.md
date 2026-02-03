# Implementation Checklist - Scope Change

## ✅ Phase 1: Auth & User Management (COMPLETED)

### Auth Module

- [x] Remove customer registration endpoint
- [x] Keep admin/sales login only
- [x] Add role-based guards (ADMIN, SALES)
- [x] Add refresh token functionality (7-day expiry)
- [x] Add access token (15-minute expiry)
- [x] Add logout endpoint
- [x] Update tests

**Files:**

- ✅ `auth.controller.ts`
- ✅ `auth.service.ts`
- ✅ `auth.module.ts`
- ✅ `guards/role.guard.ts` (NEW)
- ✅ `guards/refresh-token.guard.ts` (NEW)
- ✅ `strategies/refresh-token.strategy.ts` (NEW)
- ✅ `entities/user.entity.ts`
- ✅ `auth.service.spec.ts`

### Users Module

- [x] Remove CustomerProfile references
- [x] Create staff management service
- [x] Admin-only create staff endpoint
- [x] List staff (paginated)
- [x] View staff profile
- [x] Update staff profile
- [x] Delete staff (admin only)
- [x] Update tests

**Files:**

- ✅ `users.service.ts`
- ✅ `users.controller.ts`
- ✅ `users.module.ts`
- ✅ `dtos/staff.dto.ts` (NEW)
- ✅ `users.service.spec.ts`
- ✅ `users.controller.spec.ts`

---

## ⏳ Phase 2: Vehicle Management (NEXT PRIORITY)

### Vehicle Module

- [ ] Create Vehicle entity (if not exists)
- [ ] Create Location entity (if not exists)
- [ ] Public search endpoint (GET /vehicles)
- [ ] Public filter endpoint (by make, model, price, location, dates)
- [ ] Public vehicle details endpoint (GET /vehicles/:id)
- [ ] Admin create vehicle endpoint (POST /vehicles)
- [ ] Admin edit vehicle endpoint (PUT /vehicles/:id)
- [ ] Admin delete vehicle endpoint (DELETE /vehicles/:id)
- [ ] Admin/Sales update vehicle status (PATCH /vehicles/:id/status)
- [ ] Check availability for date range

**Files to Create/Update:**

- [ ] `vehicle/vehicle.entity.ts` (verify exists)
- [ ] `vehicle/location.entity.ts` (verify exists)
- [ ] `vehicle/vehicle.service.ts`
- [ ] `vehicle/vehicle.controller.ts`
- [ ] `vehicle/vehicle.module.ts`
- [ ] `vehicle/dtos/`
- [ ] `vehicle/vehicle.service.spec.ts`
- [ ] `vehicle/vehicle.controller.spec.ts`

**Endpoints:**

```
GET    /vehicles
GET    /vehicles/:id
GET    /vehicles/search/availability
POST   /vehicles (ADMIN only)
PUT    /vehicles/:id (ADMIN only)
DELETE /vehicles/:id (ADMIN only)
PATCH  /vehicles/:id/status (ADMIN/SALES)
```

---

## ⏳ Phase 3: Booking Management

### Booking Module

- [ ] Create Booking entity with guest fields
- [ ] Public create booking endpoint (guest info)
- [ ] Calculate total price and 10% deposit
- [ ] List bookings (sales/admin view)
- [ ] View booking details
- [ ] Approve booking endpoint
- [ ] Reject booking endpoint
- [ ] Update booking status
- [ ] Generate booking reference number

**Files to Create/Update:**

- [ ] `bookings/booking.entity.ts`
- [ ] `bookings/booking.service.ts`
- [ ] `bookings/booking.controller.ts`
- [ ] `bookings/booking.module.ts`
- [ ] `bookings/dtos/`
- [ ] `bookings/booking.service.spec.ts`
- [ ] `bookings/booking.controller.spec.ts`

**Booking Fields:**

```
guestName, guestPhone (required), guestEmail, vehicleId,
startDate, endDate, pickupLocationId, totalPrice, depositAmount,
status (PENDING|APPROVED|REJECTED|COMPLETED), stripePaymentId,
approvedBy (FK to User), notes
```

**Endpoints:**

```
POST   /bookings (public: create guest booking)
GET    /bookings/:id (public: get booking details)
GET    /bookings (ADMIN/SALES: list bookings)
PUT    /bookings/:id/approve (ADMIN/SALES)
PUT    /bookings/:id/reject (ADMIN/SALES)
PUT    /bookings/:id/status (ADMIN/SALES)
```

---

## ⏳ Phase 4: Pricing Calculation

### Pricing Module

- [ ] Public pricing calculation endpoint
- [ ] Calculate days between dates
- [ ] Calculate subtotal (dailyRate × days)
- [ ] Calculate 10% deposit
- [ ] Return price breakdown

**Files to Create:**

- [ ] `pricing/pricing.service.ts`
- [ ] `pricing/pricing.controller.ts`
- [ ] `pricing/pricing.module.ts`
- [ ] `pricing/dtos/`
- [ ] `pricing/pricing.service.spec.ts`
- [ ] `pricing/pricing.controller.spec.ts`

**Endpoint:**

```
POST   /pricing/calculate (public)
Request: { vehicleId, startDate, endDate }
Response: { dailyRate, days, subtotal, deposit, total }
```

---

## ⏳ Phase 5: Payment Processing

### Payments Module

- [ ] Create Payment entity
- [ ] Create Stripe PaymentIntent for deposit
- [ ] Handle Stripe webhook
- [ ] Update Booking status on payment success
- [ ] Track payment status
- [ ] Handle payment failures

**Files to Create/Update:**

- [ ] `payments/payment.entity.ts`
- [ ] `payments/payments.service.ts`
- [ ] `payments/payments.controller.ts`
- [ ] `payments/payments.module.ts`
- [ ] `payments/dtos/`
- [ ] `payments/payments.service.spec.ts`
- [ ] `payments/payments.controller.spec.ts`

**Endpoints:**

```
POST   /payments/intent (public: create payment intent)
POST   /payments/webhook (stripe webhook)
GET    /payments/booking/:id (ADMIN/SALES: payment status)
```

---

## ⏳ Phase 6: Maintenance Tracking

### MaintenanceRecord Module

- [ ] Create MaintenanceRecord entity
- [ ] Sales create maintenance record
- [ ] List maintenance records (paginated)
- [ ] View vehicle maintenance history
- [ ] Update vehicle status during maintenance

**Files to Create:**

- [ ] `maintenance/maintenance-record.entity.ts`
- [ ] `maintenance/maintenance.service.ts`
- [ ] `maintenance/maintenance.controller.ts`
- [ ] `maintenance/maintenance.module.ts`
- [ ] `maintenance/dtos/`
- [ ] `maintenance/maintenance.service.spec.ts`
- [ ] `maintenance/maintenance.controller.spec.ts`

**Endpoints:**

```
POST   /maintenance (ADMIN/SALES: create)
GET    /maintenance (ADMIN/SALES: list)
GET    /maintenance/vehicle/:id (ADMIN/SALES: vehicle history)
```

---

## ⏳ Phase 7: Notifications

### Notifications Module

- [ ] Send booking confirmation email (to guestEmail)
- [ ] Send booking approval email
- [ ] Send booking rejection email
- [ ] Email template service
- [ ] Optional: SMS notifications (future)

**Files to Create/Update:**

- [ ] `notifications/notifications.service.ts`
- [ ] `notifications/notifications.module.ts`
- [ ] `notifications/email-templates/`

---

## ⏳ Phase 8: Dashboard

### Dashboard Module

- [ ] Pending bookings count
- [ ] Active rentals count
- [ ] Revenue from deposits
- [ ] Fleet status summary
- [ ] Recent bookings list
- [ ] Vehicle availability chart

**Files to Create:**

- [ ] `dashboard/dashboard.service.ts`
- [ ] `dashboard/dashboard.controller.ts`
- [ ] `dashboard/dashboard.module.ts`
- [ ] `dashboard/dtos/`
- [ ] `dashboard/dashboard.service.spec.ts`
- [ ] `dashboard/dashboard.controller.spec.ts`

**Endpoints:**

```
GET    /dashboard/stats (ADMIN/SALES)
GET    /dashboard/pending-bookings (ADMIN/SALES)
GET    /dashboard/fleet-status (ADMIN/SALES)
```

---

## 📋 Database Migrations

### Add Columns

- [ ] `ALTER TABLE users ADD COLUMN "refreshToken" text;`
- [ ] `ALTER TABLE users ADD COLUMN "createdBy" uuid;`
- [ ] Create indices for booking phone number lookup

### Delete Data (if applicable)

- [ ] Delete all customer_profiles records
- [ ] Delete all user records with role='CUSTOMER'

### Create New Tables

- [ ] Booking table (if not exists)
- [ ] Payment table (if not exists)
- [ ] MaintenanceRecord table (if not exists)
- [ ] DamageReport table (if not exists)

---

## 🧪 Testing

### Unit Tests

- [x] Auth service tests
- [x] Auth controller tests
- [x] Users service tests
- [x] Users controller tests
- [ ] Vehicle service tests
- [ ] Vehicle controller tests
- [ ] Booking service tests
- [ ] Booking controller tests
- [ ] Payments service tests
- [ ] Dashboard service tests

### Integration Tests

- [ ] Full auth flow (login → refresh → logout)
- [ ] Full booking flow (search → booking → payment)
- [ ] Admin staff management flow
- [ ] Sales approval flow

### E2E Tests (Optional)

- [ ] Customer booking journey
- [ ] Admin management dashboard
- [ ] Sales approval workflow

---

## 📚 Documentation Updates

- [x] REFACTORING_PLAN.md
- [x] SCOPE_CHANGE_SUMMARY.md
- [x] ENTITY_RELATIONSHIPS.md
- [x] QUICK_START.md
- [ ] API.md (Swagger/OpenAPI)
- [ ] README.md (update)

---

## 🚀 Deployment Checklist

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Stripe keys configured
- [ ] Email service configured (if applicable)
- [ ] JWT secrets configured
- [ ] First admin user created
- [ ] Swagger documentation enabled

---

## 📞 Known Issues & TODOs

### Current State

- Auth module complete and tested
- Users module complete and tested
- CustomerProfile still exists but unused

### Action Items

1. **Delete or Archive CustomerProfile**
   - Keep or delete customer_profiles table?
   - Update User entity relations if keeping

2. **Environment Setup**
   - Document required ENV variables
   - Create .env.example

3. **Stripe Integration**
   - Verify Stripe credentials
   - Test webhook handling

4. **Email Service**
   - Choose provider (SendGrid, AWS SES, etc.)
   - Configure credentials

---

## Progress Summary

```
Phase 1: Auth & Users          ████████████████████ 100% ✅
Phase 2: Vehicle Management    ░░░░░░░░░░░░░░░░░░░░  0%
Phase 3: Bookings              ░░░░░░░░░░░░░░░░░░░░  0%
Phase 4: Pricing               ░░░░░░░░░░░░░░░░░░░░  0%
Phase 5: Payments              ░░░░░░░░░░░░░░░░░░░░  0%
Phase 6: Maintenance           ░░░░░░░░░░░░░░░░░░░░  0%
Phase 7: Notifications         ░░░░░░░░░░░░░░░░░░░░  0%
Phase 8: Dashboard             ░░░░░░░░░░░░░░░░░░░░  0%

Overall Progress:              ░░░░░░░░░░░░░░░░░░░░  12.5%
```

---

## References

- `/REFACTORING_PLAN.md` - Detailed implementation guide
- `/SCOPE_CHANGE_SUMMARY.md` - Overview of changes
- `/ENTITY_RELATIONSHIPS.md` - Database schema details
- `/QUICK_START.md` - API usage examples
- `tasks/project_structure.md` - Original requirements
