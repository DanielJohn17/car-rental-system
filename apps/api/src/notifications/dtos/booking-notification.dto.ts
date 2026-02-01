import { ApiProperty } from '@nestjs/swagger';

export class BookingNotificationDto {
  @ApiProperty({
    description: 'Booking ID',
    type: 'string',
    format: 'uuid',
  })
  bookingId: string;

  @ApiProperty({
    description: 'Guest email address',
    type: 'string',
    example: 'guest@example.com',
  })
  guestEmail: string;

  @ApiProperty({
    description: 'Guest name',
    type: 'string',
    example: 'John Doe',
  })
  guestName: string;

  @ApiProperty({
    description: 'Vehicle display (make model year)',
    type: 'string',
    example: 'Toyota Camry 2023',
  })
  vehicleDisplay: string;

  @ApiProperty({
    description: 'Pickup location name',
    type: 'string',
    example: 'Downtown Branch',
  })
  pickupLocation: string;

  @ApiProperty({
    description: 'Pickup date and time',
    type: 'string',
    format: 'date-time',
  })
  pickupDateTime: Date;

  @ApiProperty({
    description: 'Return date and time',
    type: 'string',
    format: 'date-time',
  })
  returnDateTime: Date;

  @ApiProperty({
    description: 'Total rental price',
    type: 'number',
    example: 250.0,
  })
  totalPrice: number;

  @ApiProperty({
    description: 'Deposit amount',
    type: 'number',
    example: 25.0,
  })
  depositAmount: number;

  @ApiProperty({
    description: 'Booking reference number',
    type: 'string',
    example: 'BK-20240815-001',
  })
  referenceNumber: string;
}
