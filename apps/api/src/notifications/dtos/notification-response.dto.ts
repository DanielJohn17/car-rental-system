import { ApiProperty } from '@nestjs/swagger';

export class NotificationResponseDto {
  @ApiProperty({
    description: 'Message ID from Resend',
    type: 'string',
    example: 'd8f0e53e-acbb-47f6-b4d5-76da9f46f15e',
  })
  messageId: string;

  @ApiProperty({
    description: 'Recipient email address',
    type: 'string',
    example: 'guest@example.com',
  })
  to: string;

  @ApiProperty({
    description: 'Email subject',
    type: 'string',
    example: 'Booking Confirmation - Your Car Rental',
  })
  subject: string;

  @ApiProperty({
    description: 'Notification status',
    type: 'string',
    enum: ['sent', 'queued', 'failed'],
    example: 'sent',
  })
  status: 'sent' | 'queued' | 'failed';

  @ApiProperty({
    description: 'Timestamp when notification was sent',
    type: 'string',
    format: 'date-time',
  })
  sentAt: Date;

  @ApiProperty({
    description: 'Error message if sending failed',
    type: 'string',
    example: 'Invalid email address',
    nullable: true,
  })
  error?: string;
}
