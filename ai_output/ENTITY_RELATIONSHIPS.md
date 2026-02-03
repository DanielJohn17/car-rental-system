# Entity Relationships - Updated Scope

## Entity Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER (Admin/Sales)                       │
│─────────────────────────────────────────────────────────────────│
│ id (PK)                                                           │
│ email (UNIQUE)           - Login identifier                       │
│ passwordHash             - Hashed password                        │
│ fullName                 - Display name                           │
│ phone                    - Contact number                         │
│ role                     - ADMIN | SALES (enum)                  │
│ verified                 - Account verification status            │
│ refreshToken             - JWT refresh token (nullable)           │
│ createdBy (FK)           - Which admin created this user          │
│ createdAt                - Creation timestamp                     │
│ updatedAt                - Last update timestamp                  │
└─────────────────────────────────────────────────────────────────┘
         │                      │
         │ 1:N                  │ 1:N
         ▼                      ▼
    ┌─────────┐          ┌──────────────┐
    │ BOOKING │          │ MAINTENANCE  │
    │  (Guest)│          │   RECORD     │
    └─────────┘          └──────────────┘
         │
         │ N:1
         ▼
    ┌──────────┐
    │ VEHICLE  │◄─────┐
    └──────────┘      │
         │            │
         │ N:1        │
         ▼            │
    ┌──────────┐      │
    │LOCATION  │      │
    └──────────┘      │
                      │
              ┌───────┘
              │ 1:N
              ▼
         ┌─────────────┐
         │ DAMAGE      │
         │ REPORT      │
         └─────────────┘


Note: CustomerProfile entity REMOVED (no customer accounts)
```

---

## Detailed Entity Definitions

### 1. USER (Admin/Sales Staff Only)

```typescript
@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string; // Login email

  @Column()
  passwordHash: string; // Bcrypt hashed password

  @Column()
  fullName: string; // Staff member name

  @Column()
  phone: string; // Contact phone

  @Column({ type: "enum", enum: UserRole, default: UserRole.CUSTOMER })
  role: UserRole; // ADMIN | SALES

  @Column({ default: false })
  verified: boolean; // Email verification

  @Column({ nullable: true, type: "text" })
  refreshToken: string | null; // JWT refresh token

  @Column({ nullable: true, type: "uuid" })
  createdBy: string; // Admin who created this user

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => Booking, (booking) => booking.approvedBy)
  approvedBookings: Booking[];

  @OneToMany(() => MaintenanceRecord, (record) => record.reportedBy)
  maintenanceRecords: MaintenanceRecord[];
}
```

---

### 2. VEHICLE

```typescript
@Entity("vehicles")
export class Vehicle {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  make: string; // Toyota, Honda, etc.

  @Column()
  model: string; // Model name

  @Column()
  year: number; // Manufacturing year

  @Column({ unique: true })
  licensePlate: string; // Registration plate

  @Column({ nullable: true })
  color: string;

  @Column({ nullable: true })
  fuelType: string; // PETROL, DIESEL, ELECTRIC, etc.

  @Column({ type: "decimal" })
  dailyRate: number; // Base rental price per day

  @Column({ type: "uuid" })
  locationId: string; // Current location/branch

  @Column({ type: "enum", enum: VehicleStatus })
  status: VehicleStatus; // AVAILABLE, PENDING, RENTED, MAINTENANCE

  @Column({ type: "json", nullable: true })
  images: string[]; // Array of image URLs

  @Column({ type: "json", nullable: true })
  filters: string[]; // Tags: ["SUV", "Automatic", "4WD"]

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Location, (location) => location.vehicles)
  location: Location;

  @OneToMany(() => Booking, (booking) => booking.vehicle)
  bookings: Booking[];

  @OneToMany(() => MaintenanceRecord, (record) => record.vehicle)
  maintenanceRecords: MaintenanceRecord[];

  @OneToMany(() => DamageReport, (report) => report.vehicle)
  damageReports: DamageReport[];
}
```

**Enum:**

```typescript
export enum VehicleStatus {
  AVAILABLE = "AVAILABLE",
  PENDING = "PENDING", // Booked but not approved
  RENTED = "RENTED", // Currently rented out
  MAINTENANCE = "MAINTENANCE", // In service
}
```

---

### 3. LOCATION

```typescript
@Entity("locations")
export class Location {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string; // Bole, Airport, etc.

  @Column()
  address: string; // Full address

  @Column({ type: "json", nullable: true })
  coordinates: {
    // For maps
    lat: number;
    lng: number;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => Vehicle, (vehicle) => vehicle.location)
  vehicles: Vehicle[];

  @OneToMany(() => Booking, (booking) => booking.pickupLocation)
  pickupLocations: Booking[];
}
```

---

### 4. BOOKING (Guest/Anonymous)

```typescript
@Entity("bookings")
export class Booking {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: true })
  guestName: string; // Optional: guest name

  @Column()
  guestPhone: string; // Required: for sales contact

  @Column({ nullable: true })
  guestEmail: string; // Optional: for receipts

  @Column({ type: "uuid" })
  vehicleId: string; // FK to Vehicle

  @Column()
  startDate: Date; // Pickup date/time

  @Column()
  endDate: Date; // Return date/time

  @Column({ type: "uuid" })
  pickupLocationId: string; // FK to Location

  @Column({ type: "decimal" })
  totalPrice: number; // Final quoted price

  @Column({ type: "decimal" })
  depositAmount: number; // 10% of totalPrice

  @Column({ type: "enum", enum: BookingStatus })
  status: BookingStatus; // PENDING, APPROVED, REJECTED, COMPLETED

  @Column({ nullable: true })
  stripePaymentId: string; // Stripe payment intent/charge ID

  @Column({ type: "uuid", nullable: true })
  approvedBy: string; // FK to User (sales/admin who approved)

  @Column({ type: "text", nullable: true })
  notes: string; // Special requests, notes

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Vehicle, (vehicle) => vehicle.bookings)
  vehicle: Vehicle;

  @ManyToOne(() => Location, (location) => location.pickupLocations)
  pickupLocation: Location;

  @ManyToOne(() => User, (user) => user.approvedBookings, { nullable: true })
  approver: User;

  @OneToOne(() => Payment, (payment) => payment.booking)
  payment: Payment;

  @OneToMany(() => DamageReport, (report) => report.booking)
  damageReports: DamageReport[];
}
```

**Enum:**

```typescript
export enum BookingStatus {
  PENDING = "PENDING", // Awaiting sales approval
  APPROVED = "APPROVED", // Approved by sales
  REJECTED = "REJECTED", // Rejected by sales
  COMPLETED = "COMPLETED", // Rental completed
}
```

---

### 5. PAYMENT (Deposit Only)

```typescript
@Entity("payments")
export class Payment {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid", unique: true })
  bookingId: string; // One payment per booking

  @Column({ type: "decimal" })
  amount: number; // 10% deposit amount

  @Column({ type: "enum", enum: PaymentStatus })
  status: PaymentStatus; // PENDING, PAID, FAILED, REFUNDED

  @Column({ nullable: true })
  transactionId: string; // Stripe charge/intent ID

  @Column({ nullable: true })
  paidAt: Date; // When payment was confirmed

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToOne(() => Booking, (booking) => booking.payment)
  booking: Booking;
}
```

**Enum:**

```typescript
export enum PaymentStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
}
```

---

### 6. MAINTENANCE RECORD

```typescript
@Entity("maintenance_records")
export class MaintenanceRecord {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  vehicleId: string; // FK to Vehicle

  @Column()
  date: Date; // Service date

  @Column({ type: "enum", enum: MaintenanceType })
  type: MaintenanceType; // SERVICE, REPAIR, INSPECTION

  @Column({ type: "decimal", nullable: true })
  cost: number; // Service cost

  @Column({ type: "text", nullable: true })
  notes: string; // Description, parts, issues

  @Column({ type: "uuid", nullable: true })
  reportedBy: string; // FK to User (sales/admin who reported)

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Vehicle, (vehicle) => vehicle.maintenanceRecords)
  vehicle: Vehicle;

  @ManyToOne(() => User, (user) => user.maintenanceRecords, { nullable: true })
  reporter: User;
}
```

**Enum:**

```typescript
export enum MaintenanceType {
  SERVICE = "SERVICE",
  REPAIR = "REPAIR",
  INSPECTION = "INSPECTION",
}
```

---

### 7. DAMAGE REPORT (Phase 2)

```typescript
@Entity("damage_reports")
export class DamageReport {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  bookingId: string; // FK to Booking

  @Column({ type: "uuid", nullable: true })
  vehicleId: string; // FK to Vehicle (for direct reports)

  @Column({ type: "text" })
  description: string; // Damage description

  @Column({ type: "json", nullable: true })
  images: string[]; // Array of image URLs

  @Column({ type: "decimal", nullable: true })
  costEstimate: number; // Estimated repair cost

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Booking, (booking) => booking.damageReports)
  booking: Booking;

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.damageReports)
  vehicle: Vehicle;
}
```

---

## Key Relationships

| From     | To                | Type | Notes                                      |
| -------- | ----------------- | ---- | ------------------------------------------ |
| User     | Booking           | 1:N  | Admin/Sales approves bookings (approvedBy) |
| User     | MaintenanceRecord | 1:N  | Sales reports maintenance                  |
| Vehicle  | Booking           | 1:N  | Vehicle has many bookings                  |
| Vehicle  | Location          | N:1  | Vehicle belongs to one location            |
| Vehicle  | MaintenanceRecord | 1:N  | Vehicle has maintenance history            |
| Vehicle  | DamageReport      | 1:N  | Vehicle has damage reports                 |
| Location | Vehicle           | 1:N  | Location has many vehicles                 |
| Location | Booking           | 1:N  | Pickup location in bookings                |
| Booking  | Payment           | 1:1  | One payment per booking (deposit)          |
| Booking  | DamageReport      | 1:N  | Booking can have multiple damage reports   |

---

## SQL Migration for New Fields

```sql
-- Add new columns to User table
ALTER TABLE users ADD COLUMN "refreshToken" text;
ALTER TABLE users ADD COLUMN "createdBy" uuid;

-- Add approvedAt timestamp to Booking
ALTER TABLE bookings ADD COLUMN "approvedAt" timestamp;

-- Create index for phone number (sales team needs this for quick lookup)
CREATE INDEX idx_bookings_guest_phone ON bookings("guestPhone");

-- Optionally remove customer profiles if they exist
DELETE FROM customer_profiles WHERE "userId" IN (
  SELECT id FROM users WHERE role = 'CUSTOMER'
);
```

---

## Removed Entities

### ❌ CustomerProfile

Previously linked 1:1 with User for customer-specific data (address, IDCard, rating, etc.)

- **Status**: REMOVED
- **Replacement**: Guest fields in Booking entity
- **Data Migration**: Delete all CustomerProfile records

---

## Summary

**New Architecture:**

- No customer entities or relationships
- Guests provide minimal info at booking time
- Staff (Admin/Sales) manage the system
- All relationships centered around booking and vehicle management
