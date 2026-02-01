import { ApiProperty } from '@nestjs/swagger';

export class VehicleFleetStatusDto {
  @ApiProperty({
    description: 'Vehicle ID',
    type: 'string',
    format: 'uuid',
  })
  vehicleId: string;

  @ApiProperty({
    description: 'Vehicle make/brand',
    type: 'string',
    example: 'Toyota',
  })
  make: string;

  @ApiProperty({
    description: 'Vehicle model',
    type: 'string',
    example: 'Camry',
  })
  model: string;

  @ApiProperty({
    description: 'Manufacturing year',
    type: 'number',
    example: 2023,
  })
  year: number;

  @ApiProperty({
    description: 'License plate',
    type: 'string',
    example: 'ABC-123',
  })
  licensePlate: string;

  @ApiProperty({
    description: 'Current vehicle status',
    type: 'string',
    enum: ['AVAILABLE', 'RENTED', 'MAINTENANCE', 'DAMAGED', 'RESERVED'],
    example: 'AVAILABLE',
  })
  status: string;

  @ApiProperty({
    description: 'Current location/branch',
    type: 'string',
    example: 'Downtown Branch',
  })
  location: string;

  @ApiProperty({
    description: 'Daily rental rate (USD)',
    type: 'number',
    example: 75.0,
  })
  dailyRate: number;
}

export class FleetStatusSummaryDto {
  @ApiProperty({
    description: 'Total number of vehicles in fleet',
    type: 'number',
    example: 25,
  })
  totalVehicles: number;

  @ApiProperty({
    description: 'Number of available vehicles',
    type: 'number',
    example: 18,
  })
  available: number;

  @ApiProperty({
    description: 'Number of rented vehicles',
    type: 'number',
    example: 3,
  })
  rented: number;

  @ApiProperty({
    description: 'Number of vehicles in maintenance',
    type: 'number',
    example: 2,
  })
  maintenance: number;

  @ApiProperty({
    description: 'Number of damaged vehicles',
    type: 'number',
    example: 1,
  })
  damaged: number;

  @ApiProperty({
    description: 'Number of reserved vehicles',
    type: 'number',
    example: 1,
  })
  reserved: number;

  @ApiProperty({
    description: 'List of all vehicles with their status',
    type: [VehicleFleetStatusDto],
  })
  vehicles: VehicleFleetStatusDto[];
}
