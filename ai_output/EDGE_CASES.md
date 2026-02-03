# Dashboard Module - Edge Cases & Handling

## Overview

This document outlines edge cases identified in the dashboard module and how they are handled.

---

## 1. Input Validation

### Query Parameter Limits

**Edge Case**: User sends invalid or malicious `limit` parameter

- Negative numbers (e.g., `?limit=-5`)
- Zero (e.g., `?limit=0`)
- Non-numeric values (e.g., `?limit=abc`)
- Extremely large values (e.g., `?limit=999999`)

**Handling**:

```typescript
const parsedLimit = Math.min(parseInt(limit, 10) || 10, 100);
const validLimit = Math.min(Math.max(1, limit), 100);
```

- `parseInt()` returns `NaN` for non-numeric values → fallback to 10
- Clamped to range [1, 100] to prevent DoS or excessive queries
- `Math.max(1, limit)` ensures minimum of 1 result
- `Math.min(..., 100)` caps at 100 results

---

## 2. Missing Relations (Deleted Dependencies)

### Vehicle Missing from Booking

**Edge Case**: A booking references a deleted/missing vehicle

- Vehicle cascaded delete hasn't occurred yet
- Database corruption or orphaned record

**Handling**:

```typescript
const vehicleDisplay = booking.vehicle
  ? `${booking.vehicle.make} ${booking.vehicle.model} (${booking.vehicle.year})`
  : "Unknown Vehicle";
```

- Returns "Unknown Vehicle" instead of crashing
- Prevents null reference errors

### Location Missing from Booking/Vehicle

**Edge Case**: Pickup/return location was deleted after booking created

**Handling**:

```typescript
pickupLocation: booking.pickupLocation?.name || "N/A";
location: vehicle.location?.name || "Unassigned";
```

- Uses optional chaining (`?.`)
- Fallback to 'N/A' or 'Unassigned'

---

## 3. Missing or Null Fields

### Optional Guest Fields

**Edge Case**: Guest email or name not provided

**Handling**:

```typescript
guestName: booking.guestName || "N/A";
guestEmail: booking.guestEmail; // nullable is allowed
```

- Returns 'N/A' for missing name
- Email is optional (nullable in response)

### Vehicle Attributes

**Edge Case**: Vehicle missing make, model, year, or dailyRate

**Handling**:

```typescript
make: vehicle.make || "Unknown";
model: vehicle.model || "Unknown";
year: vehicle.year || 0;
dailyRate: Number(vehicle.dailyRate) || 0;
```

- Provides sensible defaults
- Prevents JSON serialization errors

### Numeric Fields

**Edge Case**: `totalPrice`, `depositAmount`, `dailyRate` could be null or undefined

**Handling**:

```typescript
totalPrice: Number(booking.totalPrice)
Number() converts undefined → NaN, null → 0
```

- `Number()` ensures type consistency
- Falls back to 0 for falsy values

---

## 4. Payment Status Edge Cases

### Multiple Payments Per Booking

**Edge Case**: Booking has multiple payment records (shouldn't happen but could)

**Handling**:

```typescript
const depositPayment = booking.payments?.find(
  (p) => p.status === PaymentStatus.PAID,
);
depositPaid: !!depositPayment;
```

- Checks for **any paid payment** (not specific amount)
- Uses `find()` instead of assuming single payment
- `!!` converts to boolean safely

### Missing Payments Array

**Edge Case**: Payments relation not loaded or null

**Handling**:

```typescript
booking.payments?.find(...) // optional chaining prevents error
```

- Safe null/undefined access

---

## 5. Data Type Conversions

### Decimal to Number Conversion

**Edge Case**: TypeORM stores decimal as string or Decimal object

**Handling**:

```typescript
totalPrice: Number(booking.totalPrice);
dailyRate: Number(vehicle.dailyRate);
```

- `Number()` converts any numeric type safely
- Ensures JSON responses have proper number type

### Date Handling

**Edge Case**: Dates could be stored as strings or invalid Date objects

**Handling**:

- No explicit conversion; TypeORM handles Date serialization
- Swagger documents as `format: 'date-time'`
- Frontend receives ISO 8601 string

---

## 6. Vehicle Status Validation

### Unknown Vehicle Status

**Edge Case**: Vehicle status enum changed but some records still have old values

**Handling**:

```typescript
const statusCounts = {
  [VehicleStatus.AVAILABLE]: 0,
  [VehicleStatus.RENTED]: 0,
  [VehicleStatus.MAINTENANCE]: 0,
  [VehicleStatus.DAMAGED]: 0,
  [VehicleStatus.RESERVED]: 0,
};

if (vehicle.status && statusCounts.hasOwnProperty(vehicle.status)) {
  statusCounts[vehicle.status]++;
}
```

- Checks `hasOwnProperty()` before incrementing
- Unknown statuses silently ignored (not counted)
- Graceful degradation instead of error

### Default Status

**Edge Case**: Vehicle status is null/undefined

**Handling**:

```typescript
status: vehicle.status || VehicleStatus.AVAILABLE;
```

- Defaults to AVAILABLE (safe default)

---

## 7. Empty Result Sets

### No Pending Bookings

**Edge Case**: Query returns empty array

**Handling**:

- Returns `[]` instead of null
- Client-side can safely check `.length === 0`
- No error thrown

### No Vehicles in Fleet

**Edge Case**: Fleet is empty

**Handling**:

```typescript
{
  totalVehicles: 0,
  available: 0,
  rented: 0,
  maintenance: 0,
  damaged: 0,
  reserved: 0,
  vehicles: []
}
```

- Returns valid structure with zeros
- Frontend can display "No vehicles" message

---

## 8. Database Connection Failures

**Edge Case**: Database query fails during execution

**Current Handling**:

- NestJS exception handling propagates errors
- Returns 500 Internal Server Error

**Recommended Improvements**:

```typescript
try {
  const vehicles = await this.vehicleRepository.find(...);
  return { /* ... */ };
} catch (error) {
  this.logger.error('Dashboard fleet-status query failed', error);
  throw new InternalServerErrorException('Failed to load fleet status');
}
```

---

## 9. Performance Edge Cases

### Large Fleet Sizes

**Edge Case**: Fleet has 1000+ vehicles

**Current Handling**:

- Loads all vehicles into memory
- Sorting applied in JavaScript (memory intensive)

**Recommended Optimizations**:

- Add pagination or filtering by location
- Use database-level ordering: `.orderBy('status', 'ASC')`
- Implement cursor-based pagination

### Large Booking Histories

**Edge Case**: Millions of bookings in database

**Current Handling**:

- Loads specified limit (capped at 100)
- Not optimized but acceptable for dashboard

**Recommended Optimizations**:

- Add database index on `createdAt` (already exists via `@Index()`)
- Implement date-based filtering (recent only)

---

## 10. Concurrency Issues

### Race Conditions

**Edge Case**: Booking approved/completed while dashboard is loading

**Current Handling**:

- No explicit locking; reads latest state
- Dashboard reflects eventual consistency

**Acceptable Because**:

- Dashboard is read-only (no mutations)
- Small delay (< 1 sec) is acceptable for UI

---

## 11. Authorization Edge Cases

### Token Expiration

**Edge Case**: User's JWT expires during request

**Handling**:

- `JwtAuthGuard` validates before controller executes
- Returns 401 Unauthorized
- Client must refresh token

### Missing Authorization Header

**Edge Case**: Request missing `Authorization: Bearer <token>`

**Handling**:

- `JwtAuthGuard` rejects request
- Returns 401 Unauthorized

### Insufficient Role

**Edge Case**: User has CUSTOMER role instead of ADMIN/SALES

**Handling**:

- `RolesGuard` checks `@Roles(UserRole.ADMIN, UserRole.SALES)`
- Returns 403 Forbidden

---

## Summary of Defensive Practices

| Issue                 | Strategy                             |
| --------------------- | ------------------------------------ |
| Invalid limits        | Validate & clamp to [1, 100]         |
| Missing relations     | Optional chaining + fallback strings |
| Null/undefined fields | Logical OR (`\|\|`) with defaults    |
| Type conversions      | Explicit `Number()` calls            |
| Empty results         | Return valid empty collections       |
| Unknown enums         | Check `hasOwnProperty()` before use  |
| Malformed data        | Display 'Unknown' or 'N/A'           |
| Database errors       | Propagate to global error handler    |

---

## Testing Recommendations

```bash
# Test invalid limit
curl -X GET "http://localhost:5000/api/dashboard/pending-approvals?limit=-5"
curl -X GET "http://localhost:5000/api/dashboard/pending-approvals?limit=abc"
curl -X GET "http://localhost:5000/api/dashboard/pending-approvals?limit=999999"

# Test without auth
curl -X GET "http://localhost:5000/api/dashboard/overview"

# Test with invalid role
# (login as CUSTOMER, then try dashboard endpoint)

# Test empty database
# (Clear bookings/vehicles, then query each endpoint)
```
