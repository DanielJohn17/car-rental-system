# Refined Scope for Car Rental / Sharing System
Key characteristics we'll aim for (blending traditional rental + some sharing elements):

# Customers browse/search/book cars independently via app/web
Flexible durations (hours to weeks)
Self-service pickup/return possible (keyless / smart locks in future phases)
Admin approves bookings, manages fleet status, handles payments/damages
Basic sharing flavor: multiple customers per car over time, high utilization tracking

# MVP Focus (first releasable version):

- User auth + roles
- Vehicle catalog + availability
- Booking creation & simple approval flow
- Basic payment capture (or mock)
- Customer & admin dashboards

- Core Entities (Main Database Tables / Prisma Models)
From common patterns in rental systems:
# Car Rental System - Core Entities & Relationships (Phase 1)

## 1. User (Main account entity)

| Field                | Type/Notes                          | Description / Purpose                          |
|----------------------|-------------------------------------|------------------------------------------------|
| id                   | UUID / Auto-increment               | Primary key                                    |
| email                | string (unique)                     | Login + notifications                          |
| passwordHash         | string                              | Securely hashed password                       |
| fullName             | string                              | Display name                                   |
| phone                | string                              | Contact + SMS OTP                              |
| role                 | enum: CUSTOMER \| ADMIN \| DRIVER   | Access control                                 |
| drivingLicenseNumber | string (nullable)                   | Required for DRIVER role                       |
| licenseExpiry        | date (nullable)                     | Expiry check for drivers                       |
| verified             | boolean                             | Email/phone/KYC verified flag                  |

**Notes**:  
- Extend later with: profile photo, dateOfBirth, nationality, etc. for KYC  
- DRIVER role is planned but may come in phase 2

## 2. CustomerProfile (1:1 with User)

| Field          | Type/Notes               | Description                              |
|----------------|--------------------------|------------------------------------------|
| userId         | FK → User.id             | One-to-one relationship                  |
| address        | string / JSON            | Full address or structured               |
| idCardNumber   | string                   | National ID / Passport number            |
| idCardType     | enum: ID_CARD \| PASSPORT|                                          |
| depositStatus  | enum: NONE \| PAID \| HELD | Security deposit state                 |
| rating         | float (1–5)              | Average customer rating                  |

**Options**: embed into User table vs separate table (depends on how much KYC data you expect)

## 3. Vehicle (Core asset)

| Field           | Type/Notes                             | Description                              |
|-----------------|----------------------------------------|------------------------------------------|
| id              | UUID / Auto-increment                  | Primary key                              |
| make            | string                                 | Brand (Toyota, Hyundai…)                 |
| model           | string                                 | Model name                               |
| year            | integer                                | Manufacturing year                       |
| licensePlate    | string (unique)                        | Registration number                      |
| VIN             | string (unique)                        | Vehicle Identification Number            |
| color           | string                                 |                                          |
| fuelType        | enum: PETROL \| DIESEL \| ELECTRIC …   |                                          |
| transmission    | enum: MANUAL \| AUTO                   |                                          |
| seats           | integer                                |                                          |
| dailyRate       | decimal                                | Base price per day                       |
| hourlyRate      | decimal (optional)                     | For short rentals (optional)             |
| locationId      | FK → Location.id                       | Current home branch                      |
| status          | enum: AVAILABLE \| RENTED \| MAINTENANCE \| DAMAGED \| RESERVED | Main lifecycle state |
| mileage         | integer                                | Current odometer reading                 |
| images          | array of URLs / Media IDs              | Multiple photos (exterior, interior…)    |

## 4. Location / Branch (Pickup & Return points)

| Field           | Type/Notes                  | Description                              |
|-----------------|-----------------------------|------------------------------------------|
| id              | UUID / Auto-increment       | Primary key                              |
| name            | string                      | e.g. "Addis Ababa Airport", "Bole Branch"|
| address         | string / structured         | Full address                             |
| coordinates     | lat/long (or GeoJSON)       | For map display & distance calc          |
| operatingHours  | JSON / array                | e.g. Mon–Sun 07:00–21:00                 |

**Relationship**: 1 Location → Many Vehicles

## 5. Booking / Rental (Heart of the system)

| Field              | Type/Notes                                    | Description                              |
|--------------------|-----------------------------------------------|------------------------------------------|
| id                 | UUID / Auto-increment                         | Primary key                              |
| userId             | FK → User.id                                  | Customer who booked                      |
| vehicleId          | FK → Vehicle.id                               | Rented vehicle                           |
| startDateTime      | datetime                                      | Pickup time                              |
| endDateTime        | datetime                                      | Scheduled return time                    |
| pickupLocationId   | FK → Location.id                              | Where customer takes the car             |
| returnLocationId   | FK → Location.id                              | Where customer should return (can differ)|
| status             | enum: PENDING \| APPROVED \| ONGOING \| COMPLETED \| CANCELLED \| OVERDUE | Main flow |
| totalPrice         | decimal                                       | Final calculated price                   |
| actualReturnDateTime| datetime (nullable)                          | Real return timestamp                    |
| notes              | text (nullable)                               | Admin / customer notes                   |

**Relationships**  
- User 1 → Many Bookings  
- Vehicle 1 → Many Bookings

## 6. Payment

| Field          | Type/Notes                           | Description                              |
|----------------|--------------------------------------|------------------------------------------|
| id             | UUID / Auto-increment                | Primary key                              |
| bookingId      | FK → Booking.id                      |                                          |
| amount         | decimal                              | Amount paid / to be paid                 |
| paymentMethod  | enum: CARD \| MOBILE MONEY \| CASH … |                                          |
| status         | enum: PENDING \| PAID \| REFUNDED    |                                          |
| transactionId  | string (nullable)                    | Stripe / Chapa / PayPal reference        |
| paidAt         | datetime (nullable)                  | When payment succeeded                   |

**Notes**: Can be 1:1 or 1:Many (deposit + final payment + extras)

## 7. DamageReport

| Field         | Type/Notes                      | Description                              |
|---------------|---------------------------------|------------------------------------------|
| id            | UUID                            | Primary key                              |
| bookingId     | FK → Booking.id                 | Which rental                                 |
| reporterId    | FK → User.id (or Admin)         | Who reported (customer or staff)         |
| description   | text                            | Damage details                           |
| images        | array of URLs                   | Photos of damage                         |
| costEstimate  | decimal (nullable)              | Estimated repair cost                    |
| resolved      | boolean                         | Whether claim is settled                 |

## 8. MaintenanceRecord

| Field          | Type/Notes                 | Description                              |
|----------------|----------------------------|------------------------------------------|
| id             | UUID                       | Primary key                              |
| vehicleId      | FK → Vehicle.id            |                                          |
| date           | date                       | When service/repair happened             |
| type           | enum: SERVICE \| REPAIR …  |                                          |
| cost           | decimal                    |                                          |
| mileageAtTime  | integer                    | Odometer at service time                 |
| notes          | text                       | Description, parts used, etc.            |

**Phase 2 priority** (according to your note)

# Car Rental System - Core Modules & Responsibilities (MVP Focus)

## 1. Auth (Authentication & Authorization)

**Main Responsibilities**  
- User registration (email + password + phone)  
- Login / logout  
- Token refresh (JWT or similar)  
- Role-based access control (CUSTOMER / ADMIN / DRIVER)  
- Email verification  
- Phone verification (OTP)  
- Driving license upload + basic validation (for future DRIVER role)  

**MVP?** Yes  
**Depends on** — (core foundation)  

## 2. Users

**Main Responsibilities**  
- Customer profile view/edit (address, ID card/passport upload)  
- KYC document upload & verification flow (admin approval or automated checks)  
- Admin profile & management  
- Basic user listing & search (admin only)  

**MVP?** Yes  
**Depends on** Auth  

## 3. Vehicles

**Main Responsibilities**  
- Admin: Full CRUD for vehicles (create, update, delete, upload multiple images)  
- Public/Customer: Search & filter vehicles  
  - By location  
  - By availability (date range)  
  - By price range  
  - By make/model  
  - By seats / fuel type / transmission  
- Real-time availability check (not booked/rented/maintenance during requested period)  
- Vehicle detail view with images, specs, rates  

**MVP?** Yes  
**Depends on** Locations (for filtering), Bookings (for availability logic)  

## 4. Locations

**Main Responsibilities**  
- Admin: CRUD for branches / pickup & return points  
- Public: List all active locations (with name, address, coordinates, hours)  
- Used for vehicle assignment & booking pickup/return selection  

**MVP?** Yes  
**Depends on** —  

## 5. Bookings

**Main Responsibilities**  
- Create booking (select vehicle + dates + pickup/return locations)  
- Conflict & availability check  
- Price calculation (based on duration + vehicle rate + extras)  
- Status transitions:  
  PENDING → APPROVED → ONGOING → COMPLETED / CANCELLED / OVERDUE  
- Customer cancel (before start, with policy rules)  
- Admin force cancel / mark return / mark overdue  
- Record actual return datetime  

**MVP?** Yes  
**Depends on** Vehicles, Users, Pricing  

## 6. Pricing

**Main Responsibilities**  
- Define base rates per vehicle (daily, optional hourly)  
- Apply rules:  
  - Seasonal multipliers  
  - Weekend / holiday surcharges  
  - Long-term discounts  
- Handle extras:  
  - Insurance options  
  - Additional driver  
  - Fuel policy (full-to-full, etc.)  
  - Child seat / GPS  
- Calculate total price during booking creation & preview  

**MVP?** Yes  
**Depends on** — (but tightly coupled with Bookings)  

## 7. Payments

**Main Responsibilities**  
- Integrate payment gateway (e.g. Chapa, Stripe, Telebirr, etc. — Ethiopia-friendly)  
- Handle:  
  - Security deposit (hold or charge)  
  - Full/partial payment at booking  
  - Final balance on return (if needed)  
- Process refunds (full/partial for cancellations)  
- Store transaction references & status  
- Payment confirmation → trigger booking status update  

**MVP?** Yes  
**Depends on** Bookings  

## 8. Notifications

**Main Responsibilities**  
- Send email & SMS for key events:  
  - Booking created / approved  
  - Payment received  
  - Booking starting soon reminder  
  - Vehicle return due  
  - Overdue alerts  
  - Damage report submitted / resolved  

**MVP?** Partial (at least email; SMS optional in MVP)  
**Depends on** —  

## 9. Dashboard

**Main Responsibilities**  
- **Customer Dashboard**  
  - My active & past bookings  
  - Upcoming rentals  
  - Booking history & invoices  
- **Admin Dashboard**  
  - Overview stats (active rentals, revenue today/this month)  
  - Pending approvals  
  - Fleet status (available / rented / maintenance)  
  - Overdue bookings  
  - Recent damage reports  

**MVP?** Yes  
**Depends on** All above modules  

## Phase 2 / Future Modules

### Damages & Inspections
- Post-return damage reporting (customer or admin)  
- Photo upload  
- Cost estimation & assignment  
- Resolution workflow (charge customer or insurance)  

**Phase** 2  
**Depends on** Bookings  

### Maintenance
- Schedule & record services/repairs  
- Update vehicle status & availability  
- Track mileage & service history  

**Phase** 2  
**Depends on** Vehicles  

### Reports / Analytics
- Revenue reports (daily/weekly/monthly)  
- Fleet utilization rate  
- Most/least popular vehicles  
- Overdue & cancellation stats  
- Payment success/failure trends  

**Phase** 2  
**Depends on** Bookings, Payments
