import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { createRoleGuard } from '../auth/guards/role.guard';
import { UserRole } from '../auth/entities/user.entity';
import {
  CreatePaymentDto,
  PaymentStatusDto,
} from './dtos';

const SalesGuard = createRoleGuard([UserRole.SALES, UserRole.ADMIN]);

@ApiTags('payments')
@Controller('payments')
/**
 * Payment management endpoints.
 */
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
  ) {}

  /**
   * Create a payment record
   * POST /payments
   * Public endpoint - no auth required
   */
  @Post()
  @ApiOperation({
    summary: 'Create payment record',
    description: 'Creates a payment record for a booking. Returns payment details. Public endpoint.',
  })
  @ApiBody({
    type: CreatePaymentDto,
    description: 'Booking ID and payment amount',
  })
  @ApiResponse({
    status: 200,
    type: PaymentStatusDto,
    description: 'Payment created successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Booking not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid booking status or amount mismatch',
  })
  async createPayment(
    @Body(ValidationPipe) createDto: CreatePaymentDto,
  ): Promise<PaymentStatusDto> {
    return this.paymentsService.createPayment(createDto);
  }

  /**
   * Confirm a payment (mark as paid)
   * POST /payments/:id/confirm
   */
  @Post(':id/confirm')
  @UseGuards(JwtGuard, SalesGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Confirm payment',
    description: 'Mark a payment as paid. Sales/Admin only.',
  })
  @ApiParam({
    name: 'id',
    description: 'Payment ID (UUID)',
  })
  @ApiResponse({
    status: 200,
    type: PaymentStatusDto,
    description: 'Payment confirmed successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Payment not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Payment cannot be confirmed in current status',
  })
  async confirmPayment(
    @Param('id') paymentId: string,
  ): Promise<PaymentStatusDto> {
    return this.paymentsService.confirmPayment(paymentId);
  }

  /**
   * Get payment by booking ID (Sales/Admin only)
   * GET /payments/booking/:bookingId
   */
  @Get('booking/:bookingId')
  @UseGuards(JwtGuard, SalesGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Get payment by booking ID',
    description: 'Get payment details for a specific booking. Sales/Admin only.',
  })
  @ApiParam({
    name: 'bookingId',
    description: 'Booking ID (UUID)',
  })
  @ApiResponse({
    status: 200,
    type: PaymentStatusDto,
    description: 'Payment details',
  })
  @ApiResponse({
    status: 404,
    description: 'Payment not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getPaymentByBookingId(
    @Param('bookingId') bookingId: string,
  ): Promise<PaymentStatusDto> {
    return this.paymentsService.getPaymentByBookingId(bookingId);
  }

  /**
   * Get payment status by payment ID (Sales/Admin only)
   * GET /payments/:id
   */
  @Get(':id')
  @UseGuards(JwtGuard, SalesGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Get payment status',
    description: 'Get payment details and status. Sales/Admin only.',
  })
  @ApiParam({
    name: 'id',
    description: 'Payment ID (UUID)',
  })
  @ApiResponse({
    status: 200,
    type: PaymentStatusDto,
    description: 'Payment details',
  })
  @ApiResponse({
    status: 404,
    description: 'Payment not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getPaymentStatus(
    @Param('id') paymentId: string,
  ): Promise<PaymentStatusDto> {
    return this.paymentsService.getPaymentStatus(paymentId);
  }

  /**
   * Refund a payment (Sales/Admin only)
   * POST /payments/refund/:bookingId
   */
  @Post('refund/:bookingId')
  @UseGuards(JwtGuard, SalesGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Refund payment',
    description: 'Refund a paid payment. Updates booking status back to PENDING. Sales/Admin only.',
  })
  @ApiParam({
    name: 'bookingId',
    description: 'Booking ID (UUID)',
  })
  @ApiResponse({
    status: 200,
    type: PaymentStatusDto,
    description: 'Payment refunded successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Payment not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot refund payment in current status',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async refundPayment(
    @Param('bookingId') bookingId: string,
  ): Promise<PaymentStatusDto> {
    return this.paymentsService.refundPayment(bookingId);
  }
}
