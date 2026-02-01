import { ApiProperty } from '@nestjs/swagger';

export class PaymentIntentResponseDto {
  @ApiProperty({
    description: 'Client secret for Stripe payment element',
    example: 'pi_1234567890_secret_abcdef',
  })
  clientSecret: string;

  @ApiProperty({
    description: 'Stripe PaymentIntent ID',
    example: 'pi_1234567890',
  })
  paymentIntentId: string;

  @ApiProperty({
    description: 'Amount in cents',
    example: 1500,
  })
  amount: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'usd',
  })
  currency: string;

  @ApiProperty({
    description: 'Payment intent status',
    example: 'requires_payment_method',
  })
  status: string;

  @ApiProperty({
    description: 'Booking ID associated with this payment',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  bookingId: string;
}
