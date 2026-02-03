# Quick Start Guide - New Scope

## System Overview

### Who Can Access What?

| User Type       | Access                                                    | Login            |
| --------------- | --------------------------------------------------------- | ---------------- |
| **Customer**    | Browse cars, search, create booking, pay deposit          | None (Anonymous) |
| **Sales Staff** | View pending bookings, approve/reject, report maintenance | `/auth/login`    |
| **Admin**       | Manage sales staff, vehicles, approve bookings            | `/auth/login`    |

---

## API Usage Examples

### 1. Admin/Sales Login

```bash
POST /auth/login
Content-Type: application/json

{
  "email": "sales@example.com",
  "password": "SecurePassword123"
}

Response:
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "sales@example.com",
    "fullName": "John Sales",
    "role": "SALES",
    "phone": "+251912345678"
  }
}
```

### 2. Admin Creates Sales Member

```bash
POST /users
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "email": "newsales@example.com",
  "password": "SecurePassword123",
  "fullName": "Jane Doe",
  "phone": "+251912345679",
  "role": "SALES"
}

Response: [StaffResponseDto]
```

### 3. Customer Browses Cars (No Auth)

```bash
GET /vehicles?make=Toyota&location=Bole&priceMin=100&priceMax=500

Response:
[
  {
    "id": "uuid",
    "make": "Toyota",
    "model": "Corolla",
    "dailyRate": 250,
    "location": "Bole",
    "status": "AVAILABLE",
    "images": ["url1", "url2"]
  }
]
```

### 4. Customer Creates Booking (No Auth)

```bash
POST /bookings
Content-Type: application/json

{
  "guestName": "Ahmed Hassan",
  "guestPhone": "+251912345678",
  "guestEmail": "customer@example.com",
  "vehicleId": "uuid",
  "startDate": "2024-02-15",
  "endDate": "2024-02-20",
  "pickupLocationId": "uuid"
}

Response:
{
  "id": "booking-uuid",
  "status": "PENDING",
  "totalPrice": 1250,
  "depositAmount": 125,
  "stripePaymentId": null
}
```

### 5. Customer Pays Deposit (No Auth)

```bash
POST /payments/intent
Content-Type: application/json

{
  "bookingId": "booking-uuid",
  "amount": 125
}

Response:
{
  "clientSecret": "pi_..._secret_...",
  "publishableKey": "pk_test_..."
}
```

### 6. Sales Views Pending Bookings

```bash
GET /bookings?status=PENDING
Authorization: Bearer <accessToken>

Response:
[
  {
    "id": "booking-uuid",
    "guestName": "Ahmed Hassan",
    "guestPhone": "+251912345678",
    "vehicleId": "uuid",
    "startDate": "2024-02-15",
    "endDate": "2024-02-20",
    "depositStatus": "PAID",
    "status": "PENDING"
  }
]
```

### 7. Sales Approves Booking

```bash
PUT /bookings/booking-uuid/approve
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "notes": "Confirmed with customer. Ready for pickup."
}

Response:
{
  "status": "APPROVED",
  "approvedBy": "sales-user-id",
  "approvedAt": "2024-01-31T12:00:00Z"
}
```

### 8. Sales Reports Maintenance

```bash
POST /maintenance
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "vehicleId": "vehicle-uuid",
  "date": "2024-02-01",
  "type": "SERVICE",
  "cost": 5000,
  "notes": "Oil change and filter replacement"
}

Response:
{
  "id": "maintenance-uuid",
  "vehicleId": "vehicle-uuid",
  "reportedBy": "sales-user-id",
  "type": "SERVICE"
}
```

---

## Key Differences from Old Scope

### ❌ Removed

- Customer registration (`POST /auth/register`)
- Customer login endpoint
- Customer profile management
- CustomerProfile entity

### ✅ Added

- Role-based access control (ADMIN, SALES)
- Anonymous guest bookings
- 10% deposit payment flow
- Staff management (create/edit/delete sales members)
- Maintenance tracking

### ✅ Renamed

- `Users` module now manages **staff only** (not customers)
- CustomerProfile removed entirely

---

## Common Tasks

### Create First Admin Account (Database)

```sql
INSERT INTO users (id, email, "passwordHash", "fullName", phone, role, verified, "createdAt", "updatedAt")
VALUES (
  'admin-uuid',
  'admin@example.com',
  '$2a$10$...',  -- bcrypt hash of password
  'System Admin',
  '+251912345678',
  'ADMIN',
  true,
  NOW(),
  NOW()
);
```

### Refresh Access Token

```bash
POST /auth/refresh
Authorization: Bearer <refreshToken>

Response:
{
  "accessToken": "new-token",
  "refreshToken": "new-refresh-token",
  "user": { ... }
}
```

### List All Staff Members

```bash
GET /users?page=1&limit=10
Authorization: Bearer <accessToken>

Response:
{
  "data": [
    {
      "id": "uuid",
      "email": "sales@example.com",
      "fullName": "John Doe",
      "role": "SALES",
      "createdAt": "2024-01-20"
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 10
}
```

---

## Error Codes

| Code | Meaning      | Solution                               |
| ---- | ------------ | -------------------------------------- |
| 400  | Bad Request  | Check request body format              |
| 401  | Unauthorized | Missing/invalid token                  |
| 403  | Forbidden    | Insufficient permissions for this role |
| 404  | Not Found    | Resource doesn't exist                 |
| 409  | Conflict     | Email already in use                   |
| 500  | Server Error | Check server logs                      |

---

## Next Implementation Priority

1. ✅ **Auth & Users** (DONE)
2. ⏳ **Vehicles** (Priority: High)
3. ⏳ **Bookings** (Priority: High)
4. ⏳ **Payments/Stripe** (Priority: High)
5. ⏳ **Dashboard** (Priority: Medium)
6. ⏳ **MaintenanceRecord** (Priority: Medium)
7. ⏳ **Notifications** (Priority: Low)

---

## Need Help?

- **Refactoring Details**: See `/REFACTORING_PLAN.md`
- **Module Structure**: See `/SCOPE_CHANGE_SUMMARY.md`
- **Original Requirements**: See `/tasks/project_structure.md`
