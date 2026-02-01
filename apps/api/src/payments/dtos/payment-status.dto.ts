import { ApiProperty } from '@nestjs/swagger';
import { PaymentStatus } from '../entities/payment.entity';

export class PaymentStatusDto {
  @ApiProperty({
    description: 'Payment ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Booking ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  bookingId: string;

  @ApiProperty({
    description: 'Payment amount in USD cents',
    example: 1500,
  })
  amount: number;

  @ApiProperty({
    enum: PaymentStatus,
    description: 'Payment status',
    example: 'PENDING',
  })
  status: PaymentStatus;

  @ApiProperty({
    description: 'Stripe transaction ID',
    example: 'pi_1234567890',
    nullable: true,
  })
  transactionId: string | null;

  @ApiProperty({
    description: 'When payment was completed',
    example: '2024-12-20T10:30:00Z',
    nullable: true,
  })
  paidAt: Date | null;

  @ApiProperty({
    description: 'When payment record was created',
    example: '2024-12-20T10:00:00Z',
  })
  createdAt: Date;
}
