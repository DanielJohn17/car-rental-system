import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Payment,
  PaymentStatus,
  PaymentMethod,
} from './entities/payment.entity';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { CreatePaymentDto, PaymentStatusDto } from './dtos';

const MANUAL_TRANSACTION_PREFIX = 'manual_' as const;

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
  ) {}

  private mapToStatusDto(payment: Payment): PaymentStatusDto {
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

  private async getPaymentOrThrow(paymentId: string): Promise<Payment> {
    const payment: Payment | null = await this.paymentRepository.findOne({
      where: { id: paymentId },
    });
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${paymentId} not found`);
    }
    return payment;
  }

  private validateBookingPayable(booking: Booking): void {
    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException(
        `Cannot create payment for booking with status ${booking.status}. Only PENDING bookings can be paid.`,
      );
    }
  }

  private validateDepositAmountMatches(
    requestedAmountInCents: number,
    bookingDepositAmount: number,
  ): void {
    if (
      requestedAmountInCents !== Math.round(Number(bookingDepositAmount) * 100)
    ) {
      throw new BadRequestException(
        `Amount must match booking deposit amount (${bookingDepositAmount} USD)`,
      );
    }
  }

  /**
   * Create a payment record
   */
  async createPayment(createDto: CreatePaymentDto): Promise<PaymentStatusDto> {
    const booking = await this.bookingRepository.findOne({
      where: { id: createDto.bookingId },
    });

    if (!booking) {
      throw new NotFoundException(
        `Booking with ID ${createDto.bookingId} not found`,
      );
    }

    this.validateBookingPayable(booking);
    this.validateDepositAmountMatches(
      createDto.amount,
      Number(booking.depositAmount),
    );

    const existingPayment = await this.paymentRepository.findOne({
      where: { bookingId: createDto.bookingId },
      order: { createdAt: 'DESC' },
    });

    if (existingPayment) {
      throw new BadRequestException(
        'Payment has already been initialized for this booking',
      );
    }

    const payment = this.paymentRepository.create({
      bookingId: createDto.bookingId,
      userId: null,
      amount: Number(booking.depositAmount),
      paymentMethod: PaymentMethod.CARD,
      status: PaymentStatus.PENDING,
      transactionId: null,
      commissionAmount: null,
    });

    await this.paymentRepository.save(payment);

    return this.mapToStatusDto(payment);
  }

  /**
   * Confirm a payment (mark as paid)
   */
  async confirmPayment(paymentId: string): Promise<PaymentStatusDto> {
    const payment: Payment = await this.getPaymentOrThrow(paymentId);

    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException(
        `Cannot confirm payment with status ${payment.status}. Only PENDING payments can be confirmed.`,
      );
    }

    payment.status = PaymentStatus.PAID;
    payment.paidAt = new Date();
    payment.transactionId = `${MANUAL_TRANSACTION_PREFIX}${Date.now()}`;
    await this.paymentRepository.save(payment);

    // Update Booking status to APPROVED
    const booking = await this.bookingRepository.findOne({
      where: { id: payment.bookingId },
    });

    if (booking && booking.status === BookingStatus.PENDING) {
      booking.status = BookingStatus.APPROVED;
      booking.paymentReference = payment.transactionId;
      await this.bookingRepository.save(booking);
      this.logger.log(`Payment confirmed and booking ${booking.id} approved`);
    }

    return this.mapToStatusDto(payment);
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId: string): Promise<PaymentStatusDto> {
    const payment: Payment = await this.getPaymentOrThrow(paymentId);
    return this.mapToStatusDto(payment);
  }

  /**
   * Get payment by booking ID
   */
  async getPaymentByBookingId(bookingId: string): Promise<PaymentStatusDto> {
    const payment = await this.paymentRepository.findOne({
      where: { bookingId },
    });

    if (!payment) {
      throw new NotFoundException(`Payment for booking ${bookingId} not found`);
    }

    return this.mapToStatusDto(payment);
  }

  /**
   * Refund a payment
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

    return this.mapToStatusDto(payment);
  }
}
