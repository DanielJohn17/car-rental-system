import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { createRoleGuard } from '../auth/guards/role.guard';
import { UserRole } from '../auth/entities/user.entity';
import { DashboardService } from './dashboard.service';
import {
  DashboardOverviewDto,
  PendingApprovalDto,
  FleetStatusSummaryDto,
  RecentBookingDto,
} from './dtos';

@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(JwtGuard, createRoleGuard([UserRole.ADMIN, UserRole.SALES]))
@ApiBearerAuth()
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  /**
   * Get dashboard overview with key metrics
   */
  @Get('overview')
  @ApiOperation({
    summary: 'Get dashboard overview metrics',
    description:
      'Returns key metrics for the dashboard: pending bookings, active rentals, revenue, fleet status. Protected: Admin/Sales only.',
  })
  @ApiResponse({
    status: 200,
    type: DashboardOverviewDto,
    description: 'Dashboard overview with metrics',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - missing or invalid JWT token',
  })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden - user role does not have access (ADMIN/SALES required)',
  })
  async getOverview(): Promise<DashboardOverviewDto> {
    return this.dashboardService.getOverview();
  }

  /**
   * Get pending bookings awaiting approval
   */
  @Get('pending-approvals')
  @ApiOperation({
    summary: 'Get pending bookings',
    description:
      'Returns list of bookings pending approval with guest contact info and deposit status. Protected: Admin/Sales only.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of results (default: 10, max: 100)',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    type: [PendingApprovalDto],
    description: 'List of pending bookings',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid limit parameter',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - missing or invalid JWT token',
  })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden - user role does not have access (ADMIN/SALES required)',
  })
  async getPendingApprovals(
    @Query('limit') limit: string = '10',
  ): Promise<PendingApprovalDto[]> {
    const parsedLimit = Math.min(parseInt(limit, 10) || 10, 100);
    return this.dashboardService.getPendingApprovals(parsedLimit);
  }

  /**
   * Get fleet status summary
   */
  @Get('fleet-status')
  @ApiOperation({
    summary: 'Get fleet status summary',
    description:
      'Returns fleet inventory summary with vehicle counts by status and detailed vehicle list. Protected: Admin/Sales only.',
  })
  @ApiResponse({
    status: 200,
    type: FleetStatusSummaryDto,
    description: 'Fleet status with vehicle summary and detailed list',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - missing or invalid JWT token',
  })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden - user role does not have access (ADMIN/SALES required)',
  })
  async getFleetStatus(): Promise<FleetStatusSummaryDto> {
    return this.dashboardService.getFleetStatus();
  }

  /**
   * Get recent bookings
   */
  @Get('recent-bookings')
  @ApiOperation({
    summary: 'Get recent bookings',
    description:
      'Returns list of recently created bookings across all statuses, ordered by creation date. Protected: Admin/Sales only.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of results (default: 10, max: 100)',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    type: [RecentBookingDto],
    description: 'List of recent bookings',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid limit parameter',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - missing or invalid JWT token',
  })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden - user role does not have access (ADMIN/SALES required)',
  })
  async getRecentBookings(
    @Query('limit') limit: string = '10',
  ): Promise<RecentBookingDto[]> {
    const parsedLimit = Math.min(parseInt(limit, 10) || 10, 100);
    return this.dashboardService.getRecentBookings(parsedLimit);
  }
}
