import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus } from '../../bookings/entities/booking.entity';

export class RecentBookingDto {
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
    description: 'Guest phone number',
    type: 'string',
    example: '+1234567890',
  })
  guestPhone: string;

  @ApiProperty({
    description: 'Vehicle display name (make model)',
    type: 'string',
    example: 'Toyota Camry',
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
    description: 'Current booking status',
    type: 'string',
    enum: Object.values(BookingStatus),
    example: BookingStatus.PENDING,
  })
  status: BookingStatus;

  @ApiProperty({
    description: 'Total rental price (USD)',
    type: 'number',
    example: 250.0,
  })
  totalPrice: number;

  @ApiProperty({
    description: 'Booking creation date and time',
    type: 'string',
    format: 'date-time',
  })
  createdAt: Date;
}
