import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApprovalNotificationDto {
  @ApiProperty({
    description: 'Booking ID',
    type: 'string',
    format: 'uuid',
  })
  bookingId: string;

  @ApiProperty({
    description: 'Guest email',
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
    description: 'Booking reference number',
    type: 'string',
    example: 'BK-20240815-001',
  })
  referenceNumber: string;

  @ApiProperty({
    description: 'Whether booking was approved',
    type: 'boolean',
    example: true,
  })
  approved: boolean;

  @ApiPropertyOptional({
    description: 'Approval notes/instructions (if approved)',
    type: 'string',
    example: 'Approved! Please bring valid ID. Full tank required at return.',
  })
  approvalNotes?: string;

  @ApiPropertyOptional({
    description: 'Rejection reason (if rejected)',
    type: 'string',
    example: 'Vehicle not available on requested dates',
  })
  rejectionReason?: string;

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
    description: 'Vehicle display',
    type: 'string',
    example: 'Toyota Camry 2023',
  })
  vehicleDisplay: string;
}
