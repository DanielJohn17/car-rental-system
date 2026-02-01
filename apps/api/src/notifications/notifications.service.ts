import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from '../bookings/entities/booking.entity';
import { EmailService } from './email.service';
import {
  SendNotificationDto,
  NotificationType,
  NotificationResponseDto,
  BookingNotificationDto,
  ApprovalNotificationDto,
} from './dtos';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private emailService: EmailService,
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
  ) {}

  /**
   * Send notification based on type
   */
  async sendNotification(
    dto: SendNotificationDto,
  ): Promise<NotificationResponseDto> {
    // Validate email
    if (!dto.to) {
      throw new BadRequestException('Recipient email is required');
    }

    try {
      let subject = '';
      let html = '';

      switch (dto.type) {
        case NotificationType.BOOKING_CREATED:
          subject = 'Booking Confirmation - Your Car Rental';
          html = this.emailService.generateBookingConfirmationHtml({
            guestName: dto.guestName || 'Valued Customer',
            bookingReference: this.generateReferenceNumber(dto.bookingId),
            vehicleDetails: dto.vehicleDetails || 'Vehicle TBD',
            pickupLocation: 'Your Selected Location',
            pickupDate: dto.pickupDate || 'TBD',
            returnDate: dto.returnDate || 'TBD',
            totalPrice: dto.totalAmount || 0,
            depositAmount: dto.depositAmount || 0,
            depositPaid: true,
          });
          break;

        case NotificationType.BOOKING_APPROVED:
          subject = 'Booking Approved - Car Rental Confirmation';
          html = this.emailService.generateApprovedHtml({
            guestName: dto.guestName || 'Valued Customer',
            bookingReference: this.generateReferenceNumber(dto.bookingId),
            vehicleDetails: dto.vehicleDetails || 'Vehicle TBD',
            pickupLocation: 'Your Selected Location',
            pickupDate: dto.pickupDate || 'TBD',
            notes: dto.approvalNotes,
          });
          break;

        case NotificationType.BOOKING_REJECTED:
          subject = 'Booking Status Update - Car Rental';
          html = this.emailService.generateRejectedHtml({
            guestName: dto.guestName || 'Valued Customer',
            bookingReference: this.generateReferenceNumber(dto.bookingId),
            reason: dto.rejectionReason,
          });
          break;

        case NotificationType.BOOKING_COMPLETED:
          subject = 'Thank You - Rental Completed';
          html = this.emailService.generateCompletionHtml({
            guestName: dto.guestName || 'Valued Customer',
            bookingReference: this.generateReferenceNumber(dto.bookingId),
            vehicleDetails: dto.vehicleDetails || 'Vehicle',
            returnDate: dto.returnDate || 'TBD',
          });
          break;

        case NotificationType.PAYMENT_CONFIRMED:
          subject = 'Payment Confirmed - Car Rental Booking';
          html = this.emailService.generateBookingConfirmationHtml({
            guestName: dto.guestName || 'Valued Customer',
            bookingReference: this.generateReferenceNumber(dto.bookingId),
            vehicleDetails: dto.vehicleDetails || 'Vehicle TBD',
            pickupLocation: 'Your Selected Location',
            pickupDate: dto.pickupDate || 'TBD',
            returnDate: dto.returnDate || 'TBD',
            totalPrice: dto.totalAmount || 0,
            depositAmount: dto.depositAmount || 0,
            depositPaid: true,
          });
          break;

        case NotificationType.REMINDER_PICKUP:
          subject = 'Reminder - Your Rental Pickup is Soon';
          html = `
            <p>Dear ${dto.guestName || 'Valued Customer'},</p>
            <p>This is a reminder that your rental pickup is scheduled for ${dto.pickupDate}.</p>
            <p>Please make sure to have your valid ID and insurance documents ready.</p>
          `;
          break;

        default:
          throw new BadRequestException(
            `Unknown notification type: ${dto.type}`,
          );
      }

      // Send email
      const result = await this.emailService.send({
        from: 'Car Rental <noreply@carrental.com>',
        to: dto.to,
        subject,
        html,
      });

      this.logger.log(
        `Notification sent: ${dto.type} to ${dto.to} (Message ID: ${result.messageId})`,
      );

      return {
        messageId: result.messageId,
        to: dto.to,
        subject,
        status: 'sent',
        sentAt: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Failed to send notification: ${dto.type}`,
        error instanceof Error ? error.message : error,
      );

      throw error;
    }
  }

  /**
   * Send booking confirmation email
   */
  async sendBookingConfirmation(
    booking: BookingNotificationDto,
  ): Promise<NotificationResponseDto> {
    if (!booking.guestEmail) {
      this.logger.warn(`Booking ${booking.bookingId} has no email address`);
      throw new BadRequestException('Guest email is required');
    }

    return this.sendNotification({
      type: NotificationType.BOOKING_CREATED,
      to: booking.guestEmail,
      bookingId: booking.bookingId,
      guestName: booking.guestName,
      vehicleDetails: booking.vehicleDisplay,
      pickupDate: booking.pickupDateTime.toISOString(),
      returnDate: booking.returnDateTime.toISOString(),
      totalAmount: booking.totalPrice,
      depositAmount: booking.depositAmount,
    });
  }

  /**
   * Send booking approval email
   */
  async sendBookingApproval(
    approval: ApprovalNotificationDto,
  ): Promise<NotificationResponseDto> {
    if (!approval.guestEmail) {
      throw new BadRequestException('Guest email is required');
    }

    if (!approval.approved) {
      // Send rejection email
      return this.sendNotification({
        type: NotificationType.BOOKING_REJECTED,
        to: approval.guestEmail,
        bookingId: approval.bookingId,
        guestName: approval.guestName,
        rejectionReason: approval.rejectionReason,
      });
    }

    // Send approval email
    return this.sendNotification({
      type: NotificationType.BOOKING_APPROVED,
      to: approval.guestEmail,
      bookingId: approval.bookingId,
      guestName: approval.guestName,
      vehicleDetails: approval.vehicleDisplay,
      pickupDate: approval.pickupDateTime.toISOString(),
      approvalNotes: approval.approvalNotes,
    });
  }

  /**
   * Send booking completion email
   */
  async sendBookingCompletion(
    bookingId: string,
  ): Promise<NotificationResponseDto> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: ['vehicle'],
    });

    if (!booking) {
      throw new BadRequestException(`Booking ${bookingId} not found`);
    }

    if (!booking.guestEmail) {
      this.logger.warn(`Booking ${bookingId} has no email address`);
      throw new BadRequestException('Guest email is required');
    }

    return this.sendNotification({
      type: NotificationType.BOOKING_COMPLETED,
      to: booking.guestEmail,
      bookingId: booking.id,
      guestName: booking.guestName,
      vehicleDetails: booking.vehicle
        ? `${booking.vehicle.make} ${booking.vehicle.model}`
        : 'Vehicle',
      returnDate: booking.endDateTime.toISOString(),
    });
  }

  /**
   * Send payment confirmation email
   */
  async sendPaymentConfirmation(
    bookingId: string,
  ): Promise<NotificationResponseDto> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: ['vehicle'],
    });

    if (!booking) {
      throw new BadRequestException(`Booking ${bookingId} not found`);
    }

    if (!booking.guestEmail) {
      this.logger.warn(`Booking ${bookingId} has no email address`);
      throw new BadRequestException('Guest email is required');
    }

    return this.sendNotification({
      type: NotificationType.PAYMENT_CONFIRMED,
      to: booking.guestEmail,
      bookingId: booking.id,
      guestName: booking.guestName,
      vehicleDetails: booking.vehicle
        ? `${booking.vehicle.make} ${booking.vehicle.model}`
        : 'Vehicle',
      pickupDate: booking.startDateTime.toISOString(),
      returnDate: booking.endDateTime.toISOString(),
      totalAmount: Number(booking.totalPrice),
      depositAmount: Number(booking.depositAmount),
    });
  }

  /**
   * Send pickup reminder email
   */
  async sendPickupReminder(
    bookingId: string,
  ): Promise<NotificationResponseDto> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: ['vehicle'],
    });

    if (!booking) {
      throw new BadRequestException(`Booking ${bookingId} not found`);
    }

    if (!booking.guestEmail) {
      this.logger.warn(`Booking ${bookingId} has no email address`);
      throw new BadRequestException('Guest email is required');
    }

    return this.sendNotification({
      type: NotificationType.REMINDER_PICKUP,
      to: booking.guestEmail,
      bookingId: booking.id,
      guestName: booking.guestName,
      pickupDate: booking.startDateTime.toISOString(),
    });
  }

  /**
   * Generate booking reference number from booking ID
   */
  private generateReferenceNumber(bookingId: string): string {
    const timestamp = new Date().getTime().toString().slice(-6);
    const idSnippet = bookingId.substring(0, 6).toUpperCase();
    return `BK-${timestamp}-${idSnippet}`;
  }
}
