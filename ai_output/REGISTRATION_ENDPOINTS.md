# Registration Endpoints - Admin & Staff

## Overview

Two registration endpoints have been added:

1. **Admin Registration** - For initial setup (first admin account)
2. **Staff Registration** - For admins to create sales staff members

---

## 1. Admin Registration

**Endpoint:** `POST /auth/register/admin`

**Purpose:** Register the first admin account without authentication. If an admin already exists, a registration token is required.

**Request Body:**

```json
{
  "email": "admin@example.com",
  "password": "securePassword123",
  "fullName": "John Admin",
  "phone": "+251912345678",
  "registrationToken": "admin-token-optional"
}
```

**Fields:**

- `email` (required) - Unique email address
- `password` (required) - Minimum 8 characters
- `fullName` (required) - Full name of admin
- `phone` (required) - Phone number in E.164 format
- `registrationToken` (optional) - Required if admin already exists

**Response (201 Created):**

```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "fullName": "John Admin",
    "phone": "+251912345678",
    "role": "ADMIN",
    "verified": true
  }
}
```

**Error Responses:**

- `400 Bad Request` - Invalid password or admin already exists without token
- `409 Conflict` - Email already in use
- `401 Unauthorized` - Invalid registration token

**Security:**

- First admin can be created without token
- Subsequent admins require `ADMIN_REGISTRATION_TOKEN` environment variable
- Example: `ADMIN_REGISTRATION_TOKEN=your-secret-token-here`

---

## 2. Staff Registration

**Endpoint:** `POST /auth/register/staff`

**Authentication:** Bearer token (Admin only)

**Purpose:** Admin creates new sales staff members.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Request Body:**

```json
{
  "email": "sales@example.com",
  "password": "securePassword123",
  "fullName": "Jane Sales",
  "phone": "+251912345679"
}
```

**Fields:**

- `email` (required) - Unique email address
- `password` (required) - Minimum 8 characters
- `fullName` (required) - Full name of staff
- `phone` (required) - Phone number in E.164 format

**Response (201 Created):**

```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "sales@example.com",
    "fullName": "Jane Sales",
    "phone": "+251912345679",
    "role": "SALES",
    "verified": true,
    "createdBy": "admin-uuid"
  }
}
```

**Error Responses:**

- `400 Bad Request` - Invalid password or password too short
- `401 Unauthorized` - Invalid token, expired token, or not admin
- `403 Forbidden` - User is authenticated but not admin
- `409 Conflict` - Email already in use

---

## API Flow

### Initial Setup

```
1. POST /auth/register/admin (no auth required)
   ├─ Create first admin account
   └─ Returns tokens for immediate use

2. Admin logs in with credentials
   └─ Can now create staff members
```

### Creating Staff Members

```
1. Admin obtains access token (from login or registration)

2. POST /auth/register/staff
   ├─ Header: Authorization: Bearer <accessToken>
   ├─ Body: { email, password, fullName, phone }
   └─ Returns: Staff account with tokens
```

### Multiple Admins (If Needed)

```
1. Set ADMIN_REGISTRATION_TOKEN environment variable

2. POST /auth/register/admin
   ├─ Body: { email, password, fullName, phone, registrationToken }
   └─ Returns: New admin account with tokens
```

---

## Environment Variables

### Required (for multi-admin support)

```
ADMIN_REGISTRATION_TOKEN=your-secret-registration-token
```

If not set:

- First admin can be created without token
- Subsequent admins will be rejected (unless token is provided)

### Recommended

```
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
```

---

## Usage Examples

### Example 1: Create First Admin

```bash
curl -X POST http://localhost:3000/auth/register/admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@company.com",
    "password": "SuperSecure123",
    "fullName": "Company Admin",
    "phone": "+251912345678"
  }'
```

### Example 2: Admin Creates Staff Member

```bash
curl -X POST http://localhost:3000/auth/register/staff \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{
    "email": "sales@company.com",
    "password": "SalesPass123",
    "fullName": "John Sales",
    "phone": "+251912345679"
  }'
```

### Example 3: Create Additional Admin (With Token)

```bash
curl -X POST http://localhost:3000/auth/register/admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin2@company.com",
    "password": "SecurePass123",
    "fullName": "Second Admin",
    "phone": "+251912345680",
    "registrationToken": "your-secret-token"
  }'
```

---

## Comparison: Old vs New

### Before (Removed)

- POST `/auth/register` - Customers could register
- POST `/auth/login` - Any role could login

### After (Current)

- POST `/auth/register/admin` - Initial admin setup
- POST `/auth/register/staff` - Admin creates staff
- POST `/auth/login` - Admin/sales login
- Customers have NO registration (anonymous booking only)

---

## Access Control

| Endpoint                  | Who Can Access                     | Auth Required                      | Notes                               |
| ------------------------- | ---------------------------------- | ---------------------------------- | ----------------------------------- |
| POST /auth/register/admin | Anyone (first admin) or with token | No (first) / Optional (subsequent) | First admin free, others need token |
| POST /auth/register/staff | Admin only                         | Yes (JWT token)                    | Admin creates staff members         |
| POST /auth/login          | Admin/Sales                        | No                                 | Email/password login                |
| POST /auth/refresh        | Authenticated user                 | Yes (refresh token)                | Get new access token                |
| POST /auth/logout         | Authenticated user                 | Yes (access token)                 | Logout and clear token              |

---

## Testing

### Unit Tests

- ✅ Admin registration (first admin)
- ✅ Admin registration (with token)
- ✅ Staff registration
- ✅ Error cases (duplicate email, invalid password, etc.)

### Integration Tests

```bash
# Run auth tests
pnpm test --testPathPattern="auth"

# All tests
pnpm test
```

---

## Next Steps

1. **Deploy Code** - Push changes to main branch
2. **Create First Admin** - Use /auth/register/admin endpoint
3. **Create Staff** - Admin uses /auth/register/staff endpoint
4. **Login** - Admin/staff use /auth/login endpoint
5. **Bookings** - Customers can now create bookings without accounts

---

## Notes

- Admin accounts are automatically verified on creation
- Staff accounts are automatically verified on creation
- Both receive JWT tokens immediately after registration
- Refresh tokens expire in 7 days
- Access tokens expire in 15 minutes
- All passwords are bcrypt hashed with 10 rounds
