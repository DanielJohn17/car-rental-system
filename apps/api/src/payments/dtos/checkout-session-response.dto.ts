import { ApiProperty } from '@nestjs/swagger';

export class CheckoutSessionResponseDto {
  @ApiProperty({
    description: 'Stripe Checkout Session URL to redirect the customer to',
    example: 'https://checkout.stripe.com/c/pay/cs_test_123',
  })
  url: string;

  @ApiProperty({
    description: 'Stripe Checkout Session ID',
    example: 'cs_test_123',
  })
  sessionId: string;

  @ApiProperty({
    description: 'Stripe PaymentIntent ID created by Checkout',
    example: 'pi_1234567890',
  })
  paymentIntentId: string;

  @ApiProperty({
    description: 'Booking ID associated with this checkout session',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  bookingId: string;
}
