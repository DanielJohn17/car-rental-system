# Scope Change Update – Revised Planning for Car Rental / Sharing System
Based on the new requirements, here's a high-level planning revision to the project scope. This overrides or refines previous decisions where conflicting (e.g., no customer auth, anonymous bookings with partial payment, split user roles for admin/sales). No code – just structure, decisions, and phased adjustments.
Key scope shifts summarized:

- **Customers**: Fully anonymous access (no sign-in/register). They browse/search cars with filters, select dates/locations, submit booking request with minimal info (e.g., phone for contact), and pay 10% deposit via Stripe to confirm intent. Booking goes to "pending" until sales approval.
- **Admin & Sales Team**: Authenticated only. Separate login (e.g., /admin routes). Admin manages everything (add/remove sales members, cars, etc.). Sales views pending bookings, sees customer phone, handles manual calls/negotiations (off-system), approves/rejects, reports maintenance/damages.
- **Overall System Focus**: Booking flow (anonymous customer side), search/filters, admin/sales management of users/cars/statuses. No full customer profiles/history since anonymous.
- **Payment**: Only 10% deposit on booking submission (via Stripe). Full payment handled off-system (e.g., after sales call/negotiation).
- **No Changes to Tech**: Still monorepo, NestJS API, Next.js dashboard (now split: public customer pages vs protected admin/sales), Prisma/Neon, Stripe in packages/payments, Cloudinary in packages/storage.

# Car Rental System - Revised Core Entities (TypeORM-friendly Structure)

Adjusted for anonymous/guest customers (no User entity for customers).  
Bookings store minimal guest contact info directly.  
Focus on admin/sales-only authentication.

## 1. User (Only for Admin & Sales staff)

| Field         | Type              | Constraints / Notes                          | Description / Purpose                     |
|---------------|-------------------|----------------------------------------------|-------------------------------------------|
| id            | uuid / number     | Primary key, auto-generated                  | Unique identifier                         |
| email         | string            | unique, not null                             | Login identifier                          |
| passwordHash  | string            | not null                                     | Securely hashed password                  |
| fullName      | string            | not null                                     | Display name                              |
| phone         | string            | nullable                                     | Contact number                            |
| role          | enum              | ADMIN \| SALES                               | Access level                              |
| createdBy     | uuid / number     | FK → User.id (nullable)                      | Which admin created this sales account    |
| createdAt     | timestamp         | default now                                  |                                           |
| updatedAt     | timestamp         | on update                                    |                                           |

**Relationships**  
- Admin 1 → Many Users (sales staff created by admin)

## 2. Vehicle

| Field         | Type              | Constraints / Notes                          | Description / Purpose                     |
|---------------|-------------------|----------------------------------------------|-------------------------------------------|
| id            | uuid / number     | Primary key, auto-generated                  | Unique identifier                         |
| make          | string            | not null                                     | Brand (Toyota, Hyundai…)                  |
| model         | string            | not null                                     | Model name                                |
| year          | number            | not null                                     | Manufacturing year                        |
| licensePlate  | string            | unique, not null                             | Registration plate                        |
| color         | string            | nullable                                     | Vehicle color                             |
| fuelType      | string / enum     | nullable (PETROL, DIESEL, ELECTRIC…)         |                                           |
| dailyRate     | decimal           | not null                                     | Base daily rental price                   |
| locationId    | uuid / number     | FK → Location.id, not null                   | Current branch                            |
| status        | enum              | AVAILABLE \| PENDING \| RENTED \| MAINTENANCE | Main lifecycle state                      |
| images        | json / text[]     | nullable (array of URLs or paths)            | Multiple vehicle photos                   |
| filters       | json / string[]   | nullable (e.g. ["SUV", "Automatic", "Electric"]) | Search & categorization tags          |
| createdAt     | timestamp         | default now                                  |                                           |
| updatedAt     | timestamp         | on update                                    |                                           |

**Relationships**  
- Belongs to Location (Many-to-One)

## 3. Location

| Field         | Type              | Constraints / Notes                          | Description / Purpose                     |
|---------------|-------------------|----------------------------------------------|-------------------------------------------|
| id            | uuid / number     | Primary key, auto-generated                  | Unique identifier                         |
| name          | string            | not null                                     | e.g. "Bole Branch", "Airport Terminal"    |
| address       | string            | not null                                     | Full address                              |
| coordinates   | json              | nullable ({ lat: number, lng: number })      | For maps & distance calculations          |
| createdAt     | timestamp         | default now                                  |                                           |
| updatedAt     | timestamp         | on update                                    |                                           |

**Relationships**  
- 1 → Many Vehicles

## 4. Booking

| Field              | Type              | Constraints / Notes                          | Description / Purpose                     |
|--------------------|-------------------|----------------------------------------------|-------------------------------------------|
| id                 | uuid / number     | Primary key, auto-generated                  | Unique identifier                         |
| guestName          | string            | nullable (but recommended)                   | Guest full name                           |
| guestPhone         | string            | not null                                     | Required for contact & confirmation       |
| guestEmail         | string            | nullable                                     | Optional email for receipts/reminders     |
| vehicleId          | uuid / number     | FK → Vehicle.id, not null                    | Rented vehicle                            |
| startDate          | date / datetime   | not null                                     | Pickup date/time                          |
| endDate            | date / datetime   | not null                                     | Scheduled return date/time                |
| pickupLocationId   | uuid / number     | FK → Location.id, not null                   | Pickup branch                             |
| totalPrice         | decimal           | not null                                     | Final quoted price                        |
| depositAmount      | decimal           | not null (typically 10% of totalPrice)       | Security deposit amount                   |
| status             | enum              | PENDING \| APPROVED \| REJECTED \| COMPLETED | Booking lifecycle                         |
| stripePaymentId    | string            | nullable                                     | Reference to deposit payment              |
| notes              | text              | nullable                                     | Additional info / special requests        |
| approvedBy         | uuid / number     | FK → User.id (nullable)                      | Sales/admin who approved                  |
| createdAt          | timestamp         | default now                                  |                                           |
| updatedAt          | timestamp         | on update                                    |                                           |

**Relationships**  
- Vehicle 1 → Many Bookings  
- Optional: Sales User (approvedBy) 1 → Many Bookings

## 5. Payment

| Field         | Type              | Constraints / Notes                          | Description / Purpose                     |
|---------------|-------------------|----------------------------------------------|-------------------------------------------|
| id            | uuid / number     | Primary key, auto-generated                  | Unique identifier                         |
| bookingId     | uuid / number     | FK → Booking.id, not null, unique            | One payment per booking (deposit only)    |
| amount        | decimal           | not null                                     | Deposit amount (matches Booking.depositAmount) |
| status        | enum              | PENDING \| PAID \| FAILED \| REFUNDED        | Payment state                             |
| transactionId | string            | nullable                                     | Stripe payment intent / charge ID         |
| paidAt        | timestamp         | nullable                                     | When payment was confirmed                |
| createdAt     | timestamp         | default now                                  |                                           |
| updatedAt     | timestamp         | on update                                    |                                           |

**Relationships**  
- 1:1 with Booking (deposit-focused)

## 6. MaintenanceRecord

| Field         | Type              | Constraints / Notes                          | Description / Purpose                     |
|---------------|-------------------|----------------------------------------------|-------------------------------------------|
| id            | uuid / number     | Primary key, auto-generated                  | Unique identifier                         |
| vehicleId     | uuid / number     | FK → Vehicle.id, not null                    | Which vehicle                             |
| date          | date / datetime   | not null                                     | Service/repair date                       |
| type          | string / enum     | SERVICE \| REPAIR \| INSPECTION …            | Maintenance category                      |
| cost          | decimal           | nullable                                     | Cost of service                           |
| notes         | text              | nullable                                     | Description, parts, issues                |
| reportedBy    | uuid / number     | FK → User.id (nullable)                      | Sales/admin who recorded                  |
| createdAt     | timestamp         | default now                                  |                                           |
| updatedAt     | timestamp         | on update                                    |                                           |

**Relationships**  
- Vehicle 1 → Many MaintenanceRecords  
- User (sales) 1 → Many MaintenanceRecords

## 7. DamageReport (Phase 2)

| Field         | Type              | Constraints / Notes                          | Description / Purpose                     |
|---------------|-------------------|----------------------------------------------|-------------------------------------------|
| id            | uuid / number     | Primary key, auto-generated                  | Unique identifier                         |
| bookingId     | uuid / number     | FK → Booking.id, not null                    | Which rental                              |
| description   | text              | not null                                     | Damage details                            |
| images        | json / text[]     | nullable (array of URLs)                     | Photos of damage                          |
| costEstimate  | decimal           | nullable                                     | Estimated repair cost                     |
| createdAt     | timestamp         | default now                                  |                                           |
| updatedAt     | timestamp         | on update                                    |                                           |

**Relationships**  
- Booking 1 → Many DamageReports  
**Note**: Handled by sales post-approval (Phase 2 priority)

# Updated User Flows (MVP)
## Anonymous Customer Flow (public pages):

1. Browse/search cars with filters (make, model, price range, location, dates, tags like 'automatic').
2. Select car → view details (photos, rates).
3. Fill minimal form: dates, pickup/return, guest phone (required for sales contact), optional name/email.
4. Calculate total + 10% deposit → redirect to Stripe checkout (hosted or elements).
5. On success: booking created as PENDING → confirmation page/email with ref number.
6. No account – no history view.

## Admin Flow (protected /admin routes):

1. Login (email/password).
2. Dashboard: overview (pending bookings, fleet status).
3. Manage sales team: add (email, password, phone), edit status, remove.
4. Manage vehicles: add/remove/edit, upload photos (via storage), update status.
5. View/approve bookings (but delegate to sales mostly).

## Sales Team Flow (protected /admin routes, role-guarded):

1. Login (email/password).
2. Dashboard: list pending bookings with guest phone, vehicle, dates, deposit status.
3. View booking details → call guest manually (copy phone) for negotiation.
4. Approve/reject (update status, add notes).
5. Report maintenance/damages for vehicles.
6. View assigned/completed bookings.


# Car Rental System - Revised NestJS Modules (apps/api/src/modules/)

Adjusted priorities:  
- Guest/anonymous bookings (no customer authentication or profiles)  
- Only admin & sales staff have accounts & login  
- Public endpoints for vehicle search, booking creation, pricing, deposit payment  
- Protected endpoints for sales/admin operations

## 1. Auth

**Main Responsibilities**  
- Login endpoint for admin/sales (email + password → JWT)  
- Token refresh  
- Role guards (ADMIN | SALES)  
- Protected routes decorator  

**MVP?** Yes  
**Changes / Notes**  
- Remove all customer register/login flows  
- Only internal staff authentication

## 2. Users

**Main Responsibilities**  
- Admin: CRUD operations for sales team members  
  - Create new sales account  
  - Edit profile/status  
  - Deactivate/reactivate  
  - List all sales users  
- Basic profile view for logged-in user (self)  

**MVP?** Yes  
**Changes / Notes**  
- Only for internal users (ADMIN creates SALES)  
- No customer-related user data or endpoints

## 3. Vehicles

**Main Responsibilities**  
- Admin/Sales: Full CRUD (create, read, update, delete, upload images)  
- Public:  
  - Search & filter vehicles (location, dates, price, make, filters/tags)  
  - Get vehicle details by ID  
  - Check availability for date range  
- Admin/Sales: Update status (AVAILABLE → MAINTENANCE etc.)  

**MVP?** Yes  
**Changes / Notes**  
- Public search & detail endpoints (no auth required)  
- Availability logic critical for booking flow

## 4. Locations

**Main Responsibilities**  
- Public: List all active locations (name, address, coordinates)  
- Admin/Sales: CRUD for branches/pickup points  

**MVP?** Yes  
**Changes / Notes**  
- Public list endpoint (used in frontend search/booking)  
- Minimal changes from previous plan

## 5. Bookings

**Main Responsibilities**  
- Public (anonymous):  
  - Create booking (guestName, guestPhone, guestEmail?, vehicleId, dates, pickupLocation, totalPrice, depositAmount)  
  - Return booking preview with calculated price & deposit  
- Sales:  
  - List pending/approved/rejected bookings  
  - Approve / Reject bookings  
  - Update status (e.g. mark as COMPLETED on return)  
  - View booking details  
- Auto-generate notes or status logs if needed  

**MVP?** Yes  
**Changes / Notes**  
- Public create endpoint (no JWT required)  
- Guest info stored directly in Booking  
- Sales-only approval & management

## 6. Pricing

**Main Responsibilities**  
- Public: Calculate rental price & deposit  
  - Based on vehicle dailyRate + duration  
  - Apply any simple rules (future: seasonal, extras)  
- Return breakdown (base price, deposit 10%, total)  

**MVP?** Yes  
**Changes / Notes**  
- Exposed as public endpoint (used before/ during booking creation)  
- Keep simple in MVP (no complex rules yet)

## 7. Payments

**Main Responsibilities**  
- Public:  
  - Create Stripe PaymentIntent for deposit amount  
  - Return client_secret for frontend checkout  
- Webhook:  
  - Handle Stripe payment success → update Booking & Payment status  
  - Handle failure/refund if needed  
- Sales: View payment status per booking  

**MVP?** Yes  
**Changes / Notes**  
- Deposit-only focus (10%)  
- Full payment remains off-system (cash on pickup or similar)  
- Public checkout initiation endpoint

## 8. Notifications

**Main Responsibilities**  
- On booking create: email/SMS to guest (using guestEmail/guestPhone)  
- On approve/reject: notify guest  
- Optional: SMS reminder before pickup (future)  

**MVP?** Partial  
**Changes / Notes**  
- Use guest contact info directly  
- Email mandatory, SMS nice-to-have (depends on provider like Twilio/Chapa SMS)

## 9. Dashboard

**Main Responsibilities**  
- Protected (sales/admin):  
  - Overview stats (pending bookings, active rentals, revenue from deposits)  
  - List pending approvals  
  - Fleet status summary  
  - Recent bookings  

**MVP?** Yes  
**Changes / Notes**  
- No customer dashboard (removed)  
- Only internal staff views

## Phase 2 / Future Modules

### Maintenance
- Sales: Create/maintain records for vehicles  
- Update vehicle status & availability impact  
- List history per vehicle  

**Phase** 2  
**Changes / Notes**  
- Tied to SALES role
