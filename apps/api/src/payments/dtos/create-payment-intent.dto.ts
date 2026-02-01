import { IsString, IsNumber, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentIntentDto {
  @ApiProperty({
    description: 'Booking ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsNotEmpty()
  bookingId: string;

  @ApiProperty({
    description: 'Deposit amount in USD cents (e.g. 1500 for $15.00)',
    example: 1500,
    type: 'number',
  })
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty({
    description: 'Optional email for payment receipt',
    example: 'guest@example.com',
    required: false,
  })
  @IsString()
  @IsOptional()
  email?: string;
}
