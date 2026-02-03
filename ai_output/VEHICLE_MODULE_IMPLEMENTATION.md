# Vehicle Module Implementation

## Overview

Implemented the complete Vehicle module for the Car Rental System API according to the project scope. The module handles both public (customer-facing) and protected (admin/sales staff) endpoints.

## Architecture

### Files Created

#### DTOs (`apps/api/src/vehicle/dtos/`)

- **create-vehicle.dto.ts** - Vehicle creation request validation
- **update-vehicle.dto.ts** - Vehicle update request validation (all fields optional)
- **search-vehicles.dto.ts** - Vehicle search/filter parameters
- **check-availability.dto.ts** - Availability check parameters
- **index.ts** - DTO exports

#### Service (`apps/api/src/vehicle/vehicle.service.ts`)

Comprehensive business logic for vehicle operations:

**Public Methods (No Auth Required)**

- `search(searchDto)` - Search available vehicles with filters (make, model, location, price range, fuel type, transmission, seats)
- `findById(id)` - Get vehicle details by ID
- `checkAvailability(vehicleId, dateRange, location)` - Check if vehicle is available for specific dates
- `getAvailableVehicles(startDate, endDate, locationId)` - Get all available vehicles for a date range

**Protected Methods (Admin/Sales Only)**

- `create(createVehicleDto)` - Create new vehicle with duplicate checking
- `findAll(limit, offset)` - Paginated vehicle list with relations
- `update(id, updateVehicleDto)` - Update vehicle details with conflict checks
- `delete(id)` - Delete vehicle (checks for active bookings)
- `updateStatus(id, status)` - Change vehicle status (AVAILABLE, MAINTENANCE, RENTED, DAMAGED, RESERVED)
- `updateMileage(id, mileage)` - Update vehicle mileage (prevents decreasing)
- `getMaintenanceRecords(vehicleId)` - Retrieve maintenance history
- `addMaintenanceRecord(vehicleId, type, cost, mileageAtTime, notes)` - Create maintenance record

#### Controller (`apps/api/src/vehicle/vehicle.controller.ts`)

RESTful endpoints with proper authentication and role-based access control.

**Public Endpoints**

```
GET    /vehicles/search?make=Toyota&model=Camry&locationId=...&minDailyRate=50&maxDailyRate=200
GET    /vehicles/:id
POST   /vehicles/:id/check-availability
GET    /vehicles/available/search?startDate=2024-01-01&endDate=2024-01-10&locationId=...
```

**Protected Endpoints (Admin/Sales)**

```
POST   /vehicles                          # Create vehicle
GET    /vehicles?limit=20&offset=0        # List all vehicles (paginated)
PUT    /vehicles/:id                      # Update vehicle
PUT    /vehicles/:id/status               # Change vehicle status
PUT    /vehicles/:id/mileage              # Update mileage
GET    /vehicles/:id/maintenance          # Get maintenance records
POST   /vehicles/:id/maintenance          # Add maintenance record
```

**Protected Endpoint (Admin Only)**

```
DELETE /vehicles/:id                      # Delete vehicle
```

#### Module (`apps/api/src/vehicle/vehicle.module.ts`)

- Configured TypeOrmModule with Vehicle, MaintenanceRecord, and Booking entities
- Registered VehicleService and VehicleController
- Imported LocationsModule for location relations

## Key Features

### Availability Logic

- Checks vehicle status (must be AVAILABLE)
- Verifies location matches if specified
- Queries database for overlapping bookings (excludes PENDING, APPROVED, ONGOING)
- Supports both single vehicle and bulk availability checks

### Data Validation

- License plate and VIN uniqueness enforcement
- Duplicate checks on updates
- Date validation (start < end)
- Mileage prevention (cannot decrease)
- Active booking check before deletion

### Search Filters

- By make/model (case-insensitive partial match)
- By location
- By daily rate range (min/max)
- By fuel type (PETROL, DIESEL, ELECTRIC, HYBRID)
- By transmission (MANUAL, AUTO)
- By minimum seats
- Pagination support (limit/offset)

### Vehicle Status Enums

- **AVAILABLE** - Ready to rent
- **RENTED** - Currently booked
- **MAINTENANCE** - Under service
- **DAMAGED** - Requires repair
- **RESERVED** - Pending approval

### Maintenance Record Types

- SERVICE - Scheduled maintenance
- REPAIR - Damage/issue repair
- INSPECTION - Safety/compliance inspection

## Security

### Authentication Guards

- `JwtGuard` - Verifies JWT token for protected endpoints
- `createRoleGuard([UserRole.ADMIN, UserRole.SALES])` - Role-based access control

### Protected Operations

- Vehicle creation limited to ADMIN/SALES
- Vehicle management (update, status, mileage) limited to ADMIN/SALES
- Vehicle deletion limited to ADMIN only
- Maintenance operations limited to ADMIN/SALES

### Public Operations

- Search/filter vehicles (AVAILABLE only shown)
- View vehicle details
- Check availability
- Get available vehicles for booking

## Database Relations

- Vehicle → Location (Many-to-One)
- Vehicle → Bookings (One-to-Many)
- Vehicle → MaintenanceRecords (One-to-Many)

## Error Handling

- NotFoundException - Vehicle not found
- ConflictException - Duplicate license plate/VIN
- BadRequestException - Invalid input (dates, mileage, status)

## Build Status

✅ All TypeScript compilation passed
✅ No runtime errors
✅ Ready for testing and integration
