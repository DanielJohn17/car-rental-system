import type { Request } from 'express';
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Headers,
  UseGuards,
  Req,
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
  CreatePaymentIntentDto,
  CreateCheckoutSessionDto,
  PaymentIntentResponseDto,
  CheckoutSessionResponseDto,
  PaymentStatusDto,
} from './dtos';
import type { PaymentIntentSucceededPayload } from '@car-rental/types';
import { StripeService } from './services/stripe.service';

const SalesGuard = createRoleGuard([UserRole.SALES, UserRole.ADMIN]);

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly stripeService: StripeService,
  ) {}

  /**
   * Create a Stripe PaymentIntent for deposit payment
   * POST /payments/create-intent
   * Public endpoint - no auth required
   */
  @Post('create-intent')
  @ApiOperation({
    summary: 'Create payment intent for deposit',
    description:
      'Creates a Stripe PaymentIntent for the booking deposit. Returns client_secret for frontend payment element. Public endpoint.',
  })
  @ApiBody({
    type: CreatePaymentIntentDto,
    description: 'Booking ID and deposit amount',
  })
  @ApiResponse({
    status: 200,
    type: PaymentIntentResponseDto,
    description: 'PaymentIntent created successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Booking not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid booking status or amount mismatch',
  })
  async createPaymentIntent(
    @Body() createDto: CreatePaymentIntentDto,
  ): Promise<PaymentIntentResponseDto> {
    return this.paymentsService.createPaymentIntent(createDto);
  }

  @Post('create-checkout-session')
  @ApiOperation({
    summary: 'Create Stripe Checkout Session for deposit',
    description:
      'Creates a Stripe Checkout Session URL for the booking deposit. Public endpoint.',
  })
  @ApiBody({
    type: CreateCheckoutSessionDto,
    description: 'Booking ID and deposit amount',
  })
  @ApiResponse({
    status: 200,
    type: CheckoutSessionResponseDto,
    description: 'Checkout Session created successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Booking not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid booking status or amount mismatch',
  })
  async createCheckoutSession(
    @Body() createDto: CreateCheckoutSessionDto,
  ): Promise<CheckoutSessionResponseDto> {
    return this.paymentsService.createCheckoutSession(createDto);
  }

  /**
   * Stripe webhook handler
   * POST /payments/webhook
   * No auth required - Stripe signature verification instead
   */
  @Post('webhook')
  @ApiOperation({
    summary: 'Stripe webhook receiver',
    description:
      'Receives Stripe payment events (requires Stripe signature header)',
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook processed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid webhook signature',
  })
  async handleStripeWebhook(
    @Req() request: Request,
    @Headers('stripe-signature') signature: string,
  ): Promise<{ received: boolean }> {
    // Get raw body from request (should be buffered by middleware)
    const body = (request as any).rawBody || JSON.stringify(request.body);

    try {
      const event = this.stripeService.constructWebhookEvent(body, signature);

      // Handle payment_intent.succeeded event
      if (event.type === 'payment_intent.succeeded') {
        await this.paymentsService.handlePaymentIntentSucceeded(
          event as PaymentIntentSucceededPayload,
        );
      }

      return { received: true };
    } catch (error) {
      throw error;
    }
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
   * Get payment by booking ID (Sales/Admin only)
   * GET /payments/booking/:bookingId
   */
  @Get('booking/:bookingId')
  @UseGuards(JwtGuard, SalesGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Get payment by booking ID',
    description:
      'Get payment details for a specific booking. Sales/Admin only.',
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
   * Refund a payment (Sales/Admin only)
   * POST /payments/refund/:bookingId
   */
  @Post('refund/:bookingId')
  @UseGuards(JwtGuard, SalesGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Refund payment',
    description:
      'Refund a paid deposit payment. Updates booking status back to PENDING. Sales/Admin only.',
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
