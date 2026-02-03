# Stripe Connect Implementation - Direct Charges with Commission

## Overview

Implemented Stripe Connect integration to enable direct charges to admin account with automatic platform commission on full payments.

## Architecture

### Stripe Connect Flow

```
Customer Payment
    ↓
Stripe Payment Intent (on_behalf_of admin account)
    ↓
Application Fee (platform commission)
    ↓
Admin Account receives payment minus commission
    ↓
Platform account receives commission
```

## Implementation Details

### Types (packages/types/stripe.ts)

Extended CreatePaymentIntentInput:

```typescript
interface CreatePaymentIntentInput {
  amount: number;
  currency: string;
  metadata?: Record<string, string>;
  description?: string;
  connectedAccountId?: string; // Admin Stripe Connect account ID
  applicationFeeAmount?: number; // Platform commission in cents
}
```

### StripeService (payments/services/stripe.service.ts)

- Uses `on_behalf_of` parameter for connected account charges
- Supports `application_fee_amount` for platform commission
- Full Stripe Connect webhook support

Key method:

```typescript
async createPaymentIntent(input: CreatePaymentIntentInput) {
  const params: Stripe.PaymentIntentCreateParams = {
    amount: input.amount,
    currency: input.currency.toLowerCase(),
    metadata: input.metadata,
    description: input.description,
    automatic_payment_methods: { enabled: true },
  };

  if (input.connectedAccountId) {
    params.on_behalf_of = input.connectedAccountId;
    if (input.applicationFeeAmount) {
      params.application_fee_amount = input.applicationFeeAmount;
    }
  }

  return this.stripe.paymentIntents.create(params);
}
```

### PaymentsService

- Calculates commission based on `COMMISSION_PERCENTAGE` env var
- Passes connected account ID and commission to StripeService
- Stores commission details in Payment entity

**Key logic:**

```typescript
// Calculate 10% commission (or configured percentage)
const commissionAmount = Math.round(
  (createDto.amount * this.commissionPercentage) / 100,
);

// Create payment with direct charge
const paymentIntent = await this.stripeService.createPaymentIntent({
  amount: createDto.amount,
  currency: "USD",
  connectedAccountId: this.adminStripeAccountId,
  applicationFeeAmount: commissionAmount,
  metadata: {
    bookingId: createDto.bookingId,
    commissionAmount: String(commissionAmount),
  },
});
```

### Payment Entity

New fields:

- `commissionAmount: decimal(10,2)` - Platform commission taken
- `stripeConnectedAccountId: string` - Reference to admin's Stripe Connect account

### PaymentStatusDto

Now includes commission information for reporting.

## Environment Variables Required

```env
# Stripe
STRIPE_API_KEY=sk_live_...              # Main platform Stripe key
STRIPE_WEBHOOK_SECRET=whsec_...         # Webhook signing secret
STRIPE_ADMIN_ACCOUNT_ID=acct_...        # Admin's Stripe Connect account ID

# Commission
COMMISSION_PERCENTAGE=10                 # Default 10% commission on payments
```

## Payment Flow

### Deposit Payment (10%)

```
1. Customer initiates booking
2. System calculates 10% deposit
3. System calculates commission (10% of 10% = 1% for example)
4. PaymentIntent created with:
   - Amount: full deposit
   - on_behalf_of: admin account
   - application_fee_amount: platform commission
5. Customer pays via Stripe
6. Funds split:
   - Admin: deposit minus platform commission
   - Platform: commission
```

### Full Payment (Future)

```
1. Sales completes rental
2. Customer pays full remaining amount
3. Commission calculated on full amount
4. Same PaymentIntent flow with higher amounts
5. Automatic payout to admin (minus commission)
```

## Database Changes

### Payment Table

```sql
ALTER TABLE payments ADD COLUMN commission_amount DECIMAL(10,2) NULL;
ALTER TABLE payments ADD COLUMN stripe_connected_account_id VARCHAR(255) NULL;
```

## Testing

All 76 tests passing ✓

**Key test coverage:**

- Commission calculation with configurable percentage
- Direct charge to connected account
- Payment intent creation with platform fee
- Refund handling with commission reversal

## Webhook Handling

Existing webhook handler (`handlePaymentIntentSucceeded`) automatically:

1. Marks payment as PAID
2. Auto-approves booking
3. Stores commission in Payment record
4. Commission deducted from next admin payout

## Security Considerations

✓ Commission percentage configurable per environment
✓ Admin account ID required via environment variable
✓ Stripe signature verification on all webhooks
✓ Commission stored for audit trail
✓ All transactions tied to booking for traceability

## Configuration

### Development

```env
STRIPE_ADMIN_ACCOUNT_ID=acct_test123
COMMISSION_PERCENTAGE=10
```

### Production

```env
STRIPE_ADMIN_ACCOUNT_ID=acct_live_xxxx  # Admin's live account
COMMISSION_PERCENTAGE=10                 # Or custom percentage
```

## API Endpoints Affected

### POST /payments/create-intent

Now includes commission calculation in response metadata.

### GET /payments/:id

Now returns commission details:

```json
{
  "id": "payment-123",
  "bookingId": "booking-123",
  "amount": 1500,
  "commissionAmount": 150,
  "status": "PAID",
  "stripeConnectedAccountId": "acct_admin123"
}
```

## Future Enhancements

- [ ] Dynamic commission rates per vehicle type
- [ ] Tiered commission structure (e.g., 10% first 10 bookings, 5% after)
- [ ] Commission reporting dashboard
- [ ] Payout schedule configuration
- [ ] Charge refund with commission handling
- [ ] Multi-currency support
- [ ] Webhook retry logic for failed payouts

## Related Documentation

- [Stripe Connect Documentation](https://stripe.com/docs/connect)
- [Direct Charges Documentation](https://stripe.com/docs/connect/direct-charges)
- [Application Fees](https://stripe.com/docs/connect/application-fees)
