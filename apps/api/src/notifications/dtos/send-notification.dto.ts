import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export enum NotificationType {
  BOOKING_CREATED = 'BOOKING_CREATED',
  BOOKING_APPROVED = 'BOOKING_APPROVED',
  BOOKING_REJECTED = 'BOOKING_REJECTED',
  BOOKING_COMPLETED = 'BOOKING_COMPLETED',
  PAYMENT_CONFIRMED = 'PAYMENT_CONFIRMED',
  REMINDER_PICKUP = 'REMINDER_PICKUP',
}

export class SendNotificationDto {
  @ApiProperty({
    description: 'Notification type',
    enum: NotificationType,
    example: NotificationType.BOOKING_CREATED,
  })
  type: NotificationType;

  @ApiProperty({
    description: 'Recipient email address',
    type: 'string',
    example: 'guest@example.com',
  })
  @IsEmail()
  to: string;

  @ApiProperty({
    description: 'Booking ID reference',
    type: 'string',
    format: 'uuid',
  })
  bookingId: string;

  @ApiProperty({
    description: 'Guest name',
    type: 'string',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  guestName?: string;

  @ApiProperty({
    description: 'Vehicle details for booking',
    type: 'string',
    example: 'Toyota Camry 2023',
  })
  @IsOptional()
  @IsString()
  vehicleDetails?: string;

  @ApiProperty({
    description: 'Pickup date in ISO format',
    type: 'string',
    format: 'date-time',
    example: '2024-08-15T10:00:00Z',
  })
  @IsOptional()
  @IsString()
  pickupDate?: string;

  @ApiProperty({
    description: 'Return date in ISO format',
    type: 'string',
    format: 'date-time',
    example: '2024-08-18T10:00:00Z',
  })
  @IsOptional()
  @IsString()
  returnDate?: string;

  @ApiProperty({
    description: 'Total rental amount (USD)',
    type: 'number',
    example: 250.0,
  })
  @IsOptional()
  totalAmount?: number;

  @ApiProperty({
    description: 'Deposit amount (USD)',
    type: 'number',
    example: 25.0,
  })
  @IsOptional()
  depositAmount?: number;

  @ApiProperty({
    description: 'Rejection reason (for BOOKING_REJECTED)',
    type: 'string',
    example: 'Vehicle not available on requested dates',
  })
  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @ApiProperty({
    description: 'Approval notes (for BOOKING_APPROVED)',
    type: 'string',
    example: 'Approved. Please note: Full tank required at return.',
  })
  @IsOptional()
  @IsString()
  approvalNotes?: string;
}
