import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Payment,
  PaymentStatus,
  PaymentMethod,
} from './entities/payment.entity';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { Vehicle } from '../vehicle/entities/vehicle.entity';
import { User } from '../auth/entities/user.entity';
import {
  CreatePaymentIntentDto,
  PaymentIntentResponseDto,
  PaymentStatusDto,
} from './dtos';
import type { PaymentIntentSucceededPayload } from '@car-rental/types';
import { StripeService } from './services/stripe.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly commissionPercentage: number;

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private stripeService: StripeService,
    private configService: ConfigService,
  ) {
    this.commissionPercentage =
      this.configService.get<number>('COMMISSION_PERCENTAGE') || 10; // Default 10% commission
  }

  /**
   * Create a Stripe PaymentIntent for deposit payment
   * Public endpoint - no auth required
   */
  async createPaymentIntent(
    createDto: CreatePaymentIntentDto,
  ): Promise<PaymentIntentResponseDto> {
    // Validate booking exists and is PENDING
    const booking = await this.bookingRepository.findOne({
      where: { id: createDto.bookingId },
    });

    if (!booking) {
      throw new NotFoundException(
        `Booking with ID ${createDto.bookingId} not found`,
      );
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException(
        `Cannot create payment for booking with status ${booking.status}. Only PENDING bookings can be paid.`,
      );
    }

    // Validate amount matches deposit
    if (createDto.amount !== Math.round(Number(booking.depositAmount) * 100)) {
      throw new BadRequestException(
        `Amount must match booking deposit amount (${booking.depositAmount} USD)`,
      );
    }

    try {
      // Get vehicle to find owner (admin/renter)
      const vehicle = await this.vehicleRepository.findOne({
        where: { id: booking.vehicleId },
        relations: ['owner'],
      });

      if (!vehicle) {
        throw new NotFoundException(
          `Vehicle with ID ${booking.vehicleId} not found`,
        );
      }

      // Resolve admin account: use vehicle owner's account, or fallback to env var
      let adminStripeAccountId = '';
      if (vehicle.owner?.stripeConnectAccountId) {
        adminStripeAccountId = vehicle.owner.stripeConnectAccountId;
      } else {
        // Fallback to environment variable for legacy support
        adminStripeAccountId =
          this.configService.get<string>('STRIPE_ADMIN_ACCOUNT_ID') || '';
      }

      if (!adminStripeAccountId) {
        throw new BadRequestException(
          'No Stripe Connect account configured for vehicle owner',
        );
      }

      // Calculate commission for full payment (configurable percentage)
      const commissionAmount = Math.round(
        (createDto.amount * this.commissionPercentage) / 100,
      );

      // Create Stripe PaymentIntent with direct charge to owner's account
      const paymentIntent = await this.stripeService.createPaymentIntent({
        amount: createDto.amount,
        currency: 'USD',
        connectedAccountId: adminStripeAccountId,
        applicationFeeAmount: commissionAmount,
        metadata: {
          bookingId: createDto.bookingId,
          vehicleId: booking.vehicleId,
          ownerId: vehicle.ownerId || '',
          guestEmail: booking.guestEmail || '',
          guestPhone: booking.guestPhone,
          commissionAmount: String(commissionAmount),
        },
        description: `Deposit for booking ${createDto.bookingId}`,
      });

      // Create Payment record in database
      const payment = this.paymentRepository.create({
        bookingId: createDto.bookingId,
        userId: null, // Guest payment, no user ID
        amount: Number(booking.depositAmount),
        paymentMethod: PaymentMethod.CARD,
        status: PaymentStatus.PENDING,
        transactionId: paymentIntent.paymentIntentId,
        commissionAmount: Number(commissionAmount / 100), // Convert cents to dollars
        stripeConnectedAccountId: adminStripeAccountId,
      });

      await this.paymentRepository.save(payment);

      // Update Booking with stripePaymentId
      booking.stripePaymentId = paymentIntent.paymentIntentId;
      await this.bookingRepository.save(booking);

      return {
        clientSecret: paymentIntent.clientSecret,
        paymentIntentId: paymentIntent.paymentIntentId,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        bookingId: createDto.bookingId,
      };
    } catch (error) {
      this.logger.error(`Failed to create payment intent: ${error}`);
      throw new InternalServerErrorException('Failed to create payment intent');
    }
  }

  /**
   * Handle Stripe webhook for successful payment
   */
  async handlePaymentIntentSucceeded(
    payload: PaymentIntentSucceededPayload,
  ): Promise<void> {
    const paymentIntentId = payload.data.object.id;
    const bookingId = payload.data.object.metadata?.bookingId;

    if (!bookingId) {
      this.logger.warn(
        `No bookingId in payment intent metadata: ${paymentIntentId}`,
      );
      return;
    }

    try {
      // Update Payment status
      const payment = await this.paymentRepository.findOne({
        where: { transactionId: paymentIntentId },
      });

      if (!payment) {
        this.logger.warn(
          `Payment not found for transaction ${paymentIntentId}`,
        );
        return;
      }

      payment.status = PaymentStatus.PAID;
      payment.paidAt = new Date();
      await this.paymentRepository.save(payment);

      // Update Booking status to APPROVED (after payment confirmation)
      const booking = await this.bookingRepository.findOne({
        where: { id: bookingId },
      });

      if (booking && booking.status === BookingStatus.PENDING) {
        booking.status = BookingStatus.APPROVED;
        await this.bookingRepository.save(booking);
        this.logger.log(
          `Payment confirmed and booking ${bookingId} approved automatically`,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to handle payment success webhook: ${error}`);
      throw error;
    }
  }

  /**
   * Get payment status (Sales only)
   */
  async getPaymentStatus(paymentId: string): Promise<PaymentStatusDto> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${paymentId} not found`);
    }

    return {
      id: payment.id,
      bookingId: payment.bookingId,
      amount: Number(payment.amount),
      status: payment.status,
      transactionId: payment.transactionId || null,
      paidAt: payment.paidAt || null,
      createdAt: payment.createdAt,
    };
  }

  /**
   * Get payment by booking ID (Sales only)
   */
  async getPaymentByBookingId(bookingId: string): Promise<PaymentStatusDto> {
    const payment = await this.paymentRepository.findOne({
      where: { bookingId },
    });

    if (!payment) {
      throw new NotFoundException(`Payment for booking ${bookingId} not found`);
    }

    return {
      id: payment.id,
      bookingId: payment.bookingId,
      amount: Number(payment.amount),
      status: payment.status,
      transactionId: payment.transactionId || null,
      paidAt: payment.paidAt || null,
      createdAt: payment.createdAt,
    };
  }

  /**
   * Refund a payment (Sales/Admin only)
   */
  async refundPayment(bookingId: string): Promise<PaymentStatusDto> {
    const payment = await this.paymentRepository.findOne({
      where: { bookingId },
    });

    if (!payment) {
      throw new NotFoundException(`Payment for booking ${bookingId} not found`);
    }

    if (payment.status !== PaymentStatus.PAID) {
      throw new BadRequestException(
        `Cannot refund payment with status ${payment.status}. Only PAID payments can be refunded.`,
      );
    }

    if (!payment.transactionId) {
      throw new BadRequestException('Payment has no Stripe transaction ID');
    }

    try {
      // Refund through Stripe
      await this.stripeService.refundPayment(payment.transactionId);

      // Update Payment status
      payment.status = PaymentStatus.REFUNDED;
      await this.paymentRepository.save(payment);

      // Update Booking status back to PENDING
      const booking = await this.bookingRepository.findOne({
        where: { id: bookingId },
      });

      if (booking) {
        booking.status = BookingStatus.PENDING;
        await this.bookingRepository.save(booking);
      }

      return {
        id: payment.id,
        bookingId: payment.bookingId,
        amount: Number(payment.amount),
        status: payment.status,
        transactionId: payment.transactionId,
        paidAt: payment.paidAt || null,
        createdAt: payment.createdAt,
      };
    } catch (error) {
      this.logger.error(`Failed to refund payment: ${error}`);
      throw new InternalServerErrorException('Failed to refund payment');
    }
  }
}
