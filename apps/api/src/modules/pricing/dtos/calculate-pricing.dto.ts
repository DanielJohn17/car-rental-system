import {
  IsString,
  IsDateString,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CalculatePricingDto {
  @ApiProperty({
    description: 'Vehicle ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsNotEmpty()
  vehicleId: string;

  @ApiProperty({
    description: 'Start date/time in ISO 8601 format',
    example: '2024-12-20T10:00:00Z',
  })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({
    description: 'End date/time in ISO 8601 format (must be after start date)',
    example: '2024-12-23T10:00:00Z',
  })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @ApiProperty({
    description: 'Optional location ID for availability check',
    example: '550e8400-e29b-41d4-a716-446655440001',
    required: false,
  })
  @IsString()
  @IsOptional()
  locationId?: string;
}

export class PricingBreakdownDto {
  @ApiProperty({
    description: 'Vehicle ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  vehicleId: string;

  @ApiProperty({
    description: 'Requested start date',
    example: '2024-12-20T10:00:00Z',
  })
  startDate: string;

  @ApiProperty({
    description: 'Requested end date',
    example: '2024-12-23T10:00:00Z',
  })
  endDate: string;

  @ApiProperty({
    description: 'Daily rental rate of the vehicle',
    example: 50,
    type: 'number',
  })
  dailyRate: number;

  @ApiProperty({
    description: 'Number of rental days',
    example: 3,
    type: 'integer',
  })
  durationDays: number;

  @ApiProperty({
    description: 'Base price (daily rate × duration)',
    example: 150,
    type: 'number',
  })
  basePrice: number;

  @ApiProperty({
    description: 'Deposit percentage required',
    example: 10,
    type: 'integer',
  })
  depositPercentage: number;

  @ApiProperty({
    description: 'Deposit amount (10% of total price)',
    example: 15,
    type: 'number',
  })
  depositAmount: number;

  @ApiProperty({
    description: 'Total rental price',
    example: 150,
    type: 'number',
  })
  totalPrice: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'USD',
  })
  currency: string;
}
