import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PendingApprovalDto {
  @ApiProperty({
    description: 'Booking ID',
    type: 'string',
    format: 'uuid',
  })
  bookingId: string;

  @ApiProperty({
    description: 'Guest name',
    type: 'string',
    example: 'John Doe',
  })
  guestName: string;

  @ApiProperty({
    description: 'Guest phone number for contact',
    type: 'string',
    example: '+1234567890',
  })
  guestPhone: string;

  @ApiPropertyOptional({
    description: 'Guest email address',
    type: 'string',
    example: 'john@example.com',
  })
  guestEmail?: string;

  @ApiProperty({
    description: 'Vehicle ID',
    type: 'string',
    format: 'uuid',
  })
  vehicleId: string;

  @ApiProperty({
    description: 'Vehicle display name (make model year)',
    type: 'string',
    example: 'Toyota Camry (2023)',
  })
  vehicleDisplay: string;

  @ApiProperty({
    description: 'Booking start date and time',
    type: 'string',
    format: 'date-time',
  })
  startDateTime: Date;

  @ApiProperty({
    description: 'Booking end date and time',
    type: 'string',
    format: 'date-time',
  })
  endDateTime: Date;

  @ApiProperty({
    description: 'Total rental price (USD)',
    type: 'number',
    example: 250.0,
  })
  totalPrice: number;

  @ApiProperty({
    description: 'Deposit amount (USD)',
    type: 'number',
    example: 25.0,
  })
  depositAmount: number;

  @ApiProperty({
    description: 'Whether deposit has been paid',
    type: 'boolean',
    example: true,
  })
  depositPaid: boolean;

  @ApiProperty({
    description: 'Booking creation date and time',
    type: 'string',
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Pickup location name',
    type: 'string',
    example: 'Downtown Branch',
  })
  pickupLocation: string;
}
