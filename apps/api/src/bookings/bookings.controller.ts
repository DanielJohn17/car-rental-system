import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBody,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { createRoleGuard } from '../auth/guards/role.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { CreateBookingDto, UpdateBookingStatusDto } from './dtos';
import { Booking, BookingStatus } from './entities/booking.entity';

@ApiTags('bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private bookingsService: BookingsService) {}

  /**
   * Create booking (PUBLIC - anonymous)
   */
  @Post()
  @ApiOperation({ summary: 'Create new booking (anonymous/public)' })
  @ApiBody({
    type: CreateBookingDto,
    examples: {
      example1: {
        value: {
          guestName: 'John Doe',
          guestPhone: '+251911223344',
          guestEmail: 'john@example.com',
          vehicleId: 'uuid-here',
          startDateTime: '2024-02-01T10:00:00Z',
          endDateTime: '2024-02-05T10:00:00Z',
          pickupLocationId: 'uuid-here',
          returnLocationId: 'uuid-here',
          totalPrice: 400.0,
          depositAmount: 40.0,
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Booking created', type: Booking })
  @ApiResponse({
    status: 400,
    description: 'Validation error (dates, availability, pricing)',
  })
  @ApiResponse({ status: 404, description: 'Vehicle or location not found' })
  async create(@Body() createBookingDto: CreateBookingDto): Promise<Booking> {
    return this.bookingsService.create(createBookingDto);
  }

  /**
   * Get bookings (ADMIN/SALES)
   */
  @Get()
  @UseGuards(JwtGuard, createRoleGuard([UserRole.ADMIN, UserRole.SALES]))
  @ApiOperation({ summary: 'Get bookings (Admin/Sales only)' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: BookingStatus,
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Results limit (default 20)',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Results offset',
  })
  @ApiResponse({ status: 200, description: 'List of bookings' })
  async findAll(
    @Query('status') status?: BookingStatus,
    @Query('limit') limit: string = '20',
    @Query('offset') offset: string = '0',
  ) {
    return await this.bookingsService.findAll(
      status,
      parseInt(limit),
      parseInt(offset),
    );
  }

  /**
   * Get pending bookings (ADMIN/SALES)
   */
  @Get('pending')
  @UseGuards(JwtGuard, createRoleGuard([UserRole.ADMIN, UserRole.SALES]))
  @ApiOperation({ summary: 'Get pending bookings (Admin/Sales only)' })
  @ApiResponse({ status: 200, description: 'List of pending bookings' })
  async getPendingBookings(): Promise<Booking[]> {
    return this.bookingsService.getPendingBookings();
  }

  /**
   * Get booking statistics (ADMIN)
   */
  @Get('stats')
  @UseGuards(JwtGuard, createRoleGuard([UserRole.ADMIN]))
  @ApiOperation({ summary: 'Get booking statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Booking statistics' })
  async getStats() {
    return this.bookingsService.getStats();
  }

  /**
   * Get total revenue (ADMIN)
   */
  @Get('revenue')
  @UseGuards(JwtGuard, createRoleGuard([UserRole.ADMIN]))
  @ApiOperation({ summary: 'Get total revenue (Admin only)' })
  @ApiResponse({ status: 200, description: 'Total deposit revenue' })
  async getTotalRevenue() {
    return { totalRevenue: await this.bookingsService.getTotalRevenue() };
  }

  /**
   * Get booking by ID (ADMIN/SALES)
   */
  @Get(':id')
  @UseGuards(JwtGuard, createRoleGuard([UserRole.ADMIN, UserRole.SALES]))
  @ApiOperation({ summary: 'Get booking details (Admin/Sales only)' })
  @ApiParam({ name: 'id', description: 'Booking UUID' })
  @ApiResponse({ status: 200, description: 'Booking details', type: Booking })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async findById(@Param('id') id: string): Promise<Booking> {
    return this.bookingsService.findById(id);
  }

  /**
   * Approve booking (ADMIN/SALES)
   */
  @Put(':id/approve')
  @UseGuards(JwtGuard, createRoleGuard([UserRole.ADMIN, UserRole.SALES]))
  @ApiOperation({ summary: 'Approve booking (Admin/Sales only)' })
  @ApiParam({ name: 'id', description: 'Booking UUID' })
  @ApiBody({
    schema: {
      properties: {
        notes: { type: 'string', description: 'Optional approval notes' },
      },
    },
    examples: {
      example1: { value: { notes: 'Approved - customer contacted' } },
    },
  })
  @ApiResponse({ status: 200, description: 'Booking approved', type: Booking })
  @ApiResponse({
    status: 400,
    description: 'Cannot approve non-pending booking',
  })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async approve(
    @Param('id') id: string,
    @Body('notes') notes: string,
    @CurrentUser() user: any,
  ): Promise<Booking> {
    return this.bookingsService.approve(id, user.id, notes);
  }

  /**
   * Reject booking (ADMIN/SALES)
   */
  @Put(':id/reject')
  @UseGuards(JwtGuard, createRoleGuard([UserRole.ADMIN, UserRole.SALES]))
  @ApiOperation({ summary: 'Reject booking (Admin/Sales only)' })
  @ApiParam({ name: 'id', description: 'Booking UUID' })
  @ApiBody({
    schema: {
      properties: {
        notes: { type: 'string', description: 'Rejection reason' },
      },
    },
    examples: {
      example1: { value: { notes: 'Vehicle not available' } },
    },
  })
  @ApiResponse({ status: 200, description: 'Booking rejected', type: Booking })
  @ApiResponse({
    status: 400,
    description: 'Cannot reject non-pending booking',
  })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async reject(
    @Param('id') id: string,
    @Body('notes') notes: string,
    @CurrentUser() user: any,
  ): Promise<Booking> {
    return this.bookingsService.reject(id, user.id, notes);
  }

  /**
   * Update booking status (ADMIN/SALES)
   */
  @Put(':id/status')
  @UseGuards(JwtGuard, createRoleGuard([UserRole.ADMIN, UserRole.SALES]))
  @ApiOperation({ summary: 'Update booking status (Admin/Sales only)' })
  @ApiParam({ name: 'id', description: 'Booking UUID' })
  @ApiBody({
    type: UpdateBookingStatusDto,
    examples: {
      example1: {
        value: { status: 'ONGOING', notes: 'Customer picked up vehicle' },
      },
      example2: {
        value: {
          status: 'COMPLETED',
          notes: 'Vehicle returned in good condition',
        },
      },
      example3: {
        value: { status: 'OVERDUE', notes: 'Vehicle not returned on time' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Status updated', type: Booking })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateBookingStatusDto,
    @CurrentUser() user: any,
  ): Promise<Booking> {
    return this.bookingsService.updateStatus(id, updateDto, user.id);
  }

  /**
   * Complete booking (ADMIN/SALES)
   */
  @Put(':id/complete')
  @UseGuards(JwtGuard, createRoleGuard([UserRole.ADMIN, UserRole.SALES]))
  @ApiOperation({ summary: 'Mark booking as completed (Admin/Sales only)' })
  @ApiParam({ name: 'id', description: 'Booking UUID' })
  @ApiBody({
    schema: {
      properties: {
        actualReturnDateTime: {
          type: 'string',
          format: 'date-time',
          description: 'Actual return date/time',
        },
      },
    },
    examples: {
      example1: { value: { actualReturnDateTime: '2024-02-05T14:30:00Z' } },
    },
  })
  @ApiResponse({ status: 200, description: 'Booking completed', type: Booking })
  @ApiResponse({
    status: 400,
    description: 'Only ongoing bookings can be completed',
  })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async completeBooking(
    @Param('id') id: string,
    @Body('actualReturnDateTime') actualReturnDateTime?: string,
  ): Promise<Booking> {
    const returnDateTime = actualReturnDateTime
      ? new Date(actualReturnDateTime)
      : undefined;
    return this.bookingsService.completeBooking(id, returnDateTime);
  }
}
