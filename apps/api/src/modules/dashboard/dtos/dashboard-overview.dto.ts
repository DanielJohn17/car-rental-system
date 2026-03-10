import { ApiProperty } from '@nestjs/swagger';

export class DashboardOverviewDto {
  @ApiProperty({
    description: 'Number of bookings pending approval',
    type: 'number',
    example: 5,
  })
  pendingBookingsCount: number;

  @ApiProperty({
    description: 'Number of active rental bookings (ONGOING)',
    type: 'number',
    example: 3,
  })
  activeRentalsCount: number;

  @ApiProperty({
    description: 'Total revenue collected from paid deposits (USD)',
    type: 'number',
    example: 1250.5,
  })
  totalRevenueFromDeposits: number;

  @ApiProperty({
    description: 'Total number of deposits paid',
    type: 'number',
    example: 8,
  })
  totalDepositsPaid: number;

  @ApiProperty({
    description: 'Number of bookings awaiting approval (same as pending)',
    type: 'number',
    example: 5,
  })
  pendingApprovalsCount: number;

  @ApiProperty({
    description: 'Number of vehicles in maintenance',
    type: 'number',
    example: 2,
  })
  vehiclesInMaintenanceCount: number;

  @ApiProperty({
    description: 'Number of available vehicles ready for rental',
    type: 'number',
    example: 18,
  })
  availableVehiclesCount: number;
}
