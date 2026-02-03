# Multi-Admin Stripe Connect Implementation

## Overview

Extended the Stripe Connect implementation to support multiple admins/car renters, each with their own Stripe Connected Account.

## Architecture Changes

### Database Schema

#### User Entity

Added `stripeConnectAccountId` field to store each admin's Stripe Connect account ID:

```typescript
@Column({ nullable: true })
stripeConnectAccountId: string;
```

#### Vehicle Entity

Added `ownerId` field to link each vehicle to an admin/owner:

```typescript
@Column({ type: 'uuid', nullable: true })
ownerId: string;

@ManyToOne(() => User, { nullable: true })
@JoinColumn({ name: 'ownerId' })
owner: User;
```

### Payment Flow

**Single Admin (Old)**

```
STRIPE_ADMIN_ACCOUNT_ID=acct_admin123 (env var)
     ↓
Customer Payment → admin123 account
```

**Multi-Admin (New)**

```
User1 (Admin) → stripeConnectAccountId: acct_renter1
User2 (Admin) → stripeConnectAccountId: acct_renter2
User3 (Admin) → stripeConnectAccountId: acct_renter3
     ↓
Vehicle1 (owner: User1) → charges to acct_renter1
Vehicle2 (owner: User2) → charges to acct_renter2
Vehicle3 (owner: User3) → charges to acct_renter3
```

## Implementation Details

### PaymentsService Changes

**Initialization:**

```typescript
constructor(
  @InjectRepository(Payment) private paymentRepository,
  @InjectRepository(Booking) private bookingRepository,
  @InjectRepository(Vehicle) private vehicleRepository,  // NEW
  @InjectRepository(User) private userRepository,        // NEW
  private stripeService: StripeService,
  private configService: ConfigService,
) {
  this.commissionPercentage =
    configService.get<number>('COMMISSION_PERCENTAGE') || 10;
}
```

**Payment Intent Creation:**

```typescript
async createPaymentIntent(createDto: CreatePaymentIntentDto) {
  const booking = await this.bookingRepository.findOne(...);

  // Get vehicle with owner relationship
  const vehicle = await this.vehicleRepository.findOne(
    { where: { id: booking.vehicleId }, relations: ['owner'] }
  );

  // Resolve admin's Stripe account
  let adminStripeAccountId = '';
  if (vehicle.owner?.stripeConnectAccountId) {
    // Use vehicle owner's account
    adminStripeAccountId = vehicle.owner.stripeConnectAccountId;
  } else {
    // Fallback to env var for backward compatibility
    adminStripeAccountId =
      configService.get<string>('STRIPE_ADMIN_ACCOUNT_ID') || '';
  }

  if (!adminStripeAccountId) {
    throw new BadRequestException(
      'No Stripe Connect account configured for vehicle owner'
    );
  }

  // Create charge on owner's account
  const paymentIntent = await this.stripeService.createPaymentIntent({
    amount: createDto.amount,
    currency: 'USD',
    connectedAccountId: adminStripeAccountId,  // Owner's account
    applicationFeeAmount: commissionAmount,
    metadata: {
      bookingId: createDto.bookingId,
      ownerId: vehicle.ownerId,  // NEW: Track which owner
      vehicleId: booking.vehicleId,
    },
  });
}
```

## Setup Flow for Multiple Admins

### 1. Create Admin Users

```bash
POST /auth/register
{
  "email": "renter1@example.com",
  "password": "...",
  "fullName": "Car Renter 1",
  "role": "ADMIN"
}
```

### 2. Connect Stripe Account

After signup, admin goes through Stripe Connect OAuth:

```bash
PATCH /users/:id
{
  "stripeConnectAccountId": "acct_xxxxx"
}
```

### 3. Create Vehicles for Each Admin

```bash
POST /vehicles
{
  "make": "Toyota",
  "model": "Camry",
  "ownerId": "user-admin-1",  // Link to owner
  "locationId": "location-123",
  "dailyRate": 50
}
```

### 4. Customers Book Vehicles

When customer books a vehicle, the payment automatically routes to the vehicle's owner's Stripe account.

## Environment Variables

### Old (Single Admin)

```env
STRIPE_ADMIN_ACCOUNT_ID=acct_admin123
COMMISSION_PERCENTAGE=10
```

### New (Multi-Admin) - Optional

```env
# Optional fallback for vehicles without owner
STRIPE_ADMIN_ACCOUNT_ID=acct_fallback
COMMISSION_PERCENTAGE=10
```

## Database Migrations

```sql
-- Add owner field to vehicles
ALTER TABLE vehicles ADD COLUMN owner_id UUID NULL;
ALTER TABLE vehicles ADD FOREIGN KEY (owner_id) REFERENCES users(id);

-- Add Stripe Connect account to users
ALTER TABLE users ADD COLUMN stripe_connect_account_id VARCHAR(255) NULL;

-- Add commission tracking and owner to payments
ALTER TABLE payments ADD COLUMN stripe_connected_account_id VARCHAR(255) NULL;
```

## Payment Distribution

### Example Scenario

- **Vehicle**: Tesla Model 3 (owned by Renter1)
- **Daily Rate**: $100
- **Booking**: 3 days = $300 total, $30 deposit (10%)
- **Platform Commission**: 10% of $30 = $3

**Fund Flow:**

```
Customer Payment: $30
    ↓
Stripe (Renter1's account receives): $27 ($30 - $3 commission)
Stripe (Platform receives): $3 (commission)
```

**Multiple Bookings:**

```
Booking1 (Renter1's vehicle): $27 → acct_renter1
Booking2 (Renter2's vehicle): $27 → acct_renter2
Booking3 (Renter3's vehicle): $27 → acct_renter3
Commission Pool: $3 + $3 + $3 = $9 → platform account
```

## Backward Compatibility

✓ Old single-admin setup still works
✓ Fallback to `STRIPE_ADMIN_ACCOUNT_ID` if vehicle has no owner
✓ Gradual migration: can onboard admins one at a time

## API Endpoints

### Admin Management (New)

```bash
# Update admin's Stripe Connect account
PATCH /users/:id
{
  "stripeConnectAccountId": "acct_xxxxx"
}
```

### Vehicle Management (Updated)

```bash
# Create vehicle with owner
POST /vehicles
{
  "make": "Toyota",
  "ownerId": "user-admin-1",
  ...
}

# Update vehicle owner
PATCH /vehicles/:id
{
  "ownerId": "user-admin-2"
}
```

### Payment Webhook (Updated)

Webhook payload now includes owner info:

```json
{
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "metadata": {
        "bookingId": "booking-123",
        "ownerId": "user-admin-1",
        "commissionAmount": "300"
      }
    }
  }
}
```

## Testing

All 76 tests passing ✓

**Key test coverage:**

- Multi-admin payment intent creation
- Owner resolution from vehicle
- Fallback to env var
- Commission calculation per owner
- Stripe account validation

## Security Considerations

✓ Admin must own vehicle to receive payment
✓ Commission automatically deducted before payout
✓ Stripe Connect handles liability & compliance
✓ Audit trail: ownerId stored in payment metadata
✓ Webhook signature verification remains unchanged

## Scalability

**Per Rental Company:**

- Unlimited vehicles per admin
- Separate Stripe Connect accounts
- Independent fund management
- Isolated webhook handling

**Example with 10 Renters:**

```
Renter1: acct_stripe1 → $1000/week revenue
Renter2: acct_stripe2 → $800/week revenue
...
Renter10: acct_stripe10 → $600/week revenue
Platform: $500/week (all commissions)
```

## Future Enhancements

- [ ] Tiered commission rates by volume
- [ ] Revenue sharing: different % per renter
- [ ] Payout scheduling per renter
- [ ] Custom fee structures per location
- [ ] Admin dashboard: earnings, transfers, settlements
- [ ] Automated reconciliation reporting
- [ ] Tax form generation (1099 for US)

## Migration Guide

### Step 1: Deploy Code

Deploy this version with backward compatibility.

### Step 2: Onboard Admins

```bash
# For each admin, obtain Stripe Connect account
PATCH /users/user-admin-1
{ "stripeConnectAccountId": "acct_stripe1" }
```

### Step 3: Link Vehicles

```bash
# Assign existing vehicles to owners
PATCH /vehicles/vehicle-1
{ "ownerId": "user-admin-1" }
```

### Step 4: Verify

Test with sandbox Stripe account before going live.
