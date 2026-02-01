import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import {
  SendNotificationDto,
  NotificationResponseDto,
  BookingNotificationDto,
  ApprovalNotificationDto,
} from './dtos';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  /**
   * Send notification (generic)
   */
  @Post('send')
  @ApiOperation({
    summary: 'Send notification',
    description:
      'Send a notification (email) to a guest for various booking events. Public endpoint - internal use.',
  })
  @ApiBody({
    type: SendNotificationDto,
    description: 'Notification details including type, recipient, and content',
  })
  @ApiResponse({
    status: 201,
    type: NotificationResponseDto,
    description: 'Notification sent successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid email or missing required fields',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error - email service failed',
  })
  async send(
    @Body() dto: SendNotificationDto,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.sendNotification(dto);
  }

  /**
   * Send booking confirmation email
   */
  @Post('booking-confirmation')
  @ApiOperation({
    summary: 'Send booking confirmation',
    description:
      'Send confirmation email when guest creates a booking. Public endpoint.',
  })
  @ApiBody({
    type: BookingNotificationDto,
    description: 'Booking details to include in confirmation email',
  })
  @ApiResponse({
    status: 201,
    type: NotificationResponseDto,
    description: 'Confirmation email sent',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - missing guest email',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async sendBookingConfirmation(
    @Body() booking: BookingNotificationDto,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.sendBookingConfirmation(booking);
  }

  /**
   * Send booking approval/rejection email
   */
  @Post('booking-approval')
  @ApiOperation({
    summary: 'Send booking approval or rejection',
    description:
      'Send email when sales team approves or rejects a booking. Protected: Admin/Sales only.',
  })
  @ApiBody({
    type: ApprovalNotificationDto,
    description: 'Approval/rejection details',
  })
  @ApiResponse({
    status: 201,
    type: NotificationResponseDto,
    description: 'Approval/rejection email sent',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - missing guest email',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async sendBookingApproval(
    @Body() approval: ApprovalNotificationDto,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.sendBookingApproval(approval);
  }

  /**
   * Send booking completion email
   */
  @Post('booking-completion/:bookingId')
  @ApiOperation({
    summary: 'Send booking completion notification',
    description:
      'Send email when booking is completed. Protected: Admin/Sales only.',
  })
  @ApiResponse({
    status: 201,
    type: NotificationResponseDto,
    description: 'Completion email sent',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - booking not found or no email',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async sendBookingCompletion(
    bookingId: string,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.sendBookingCompletion(bookingId);
  }

  /**
   * Send payment confirmation email
   */
  @Post('payment-confirmation/:bookingId')
  @ApiOperation({
    summary: 'Send payment confirmation',
    description:
      'Send email when deposit payment is confirmed. Called after Stripe webhook.',
  })
  @ApiResponse({
    status: 201,
    type: NotificationResponseDto,
    description: 'Payment confirmation email sent',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - booking not found or no email',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async sendPaymentConfirmation(
    bookingId: string,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.sendPaymentConfirmation(bookingId);
  }

  /**
   * Send pickup reminder email
   */
  @Post('pickup-reminder/:bookingId')
  @ApiOperation({
    summary: 'Send pickup reminder',
    description:
      'Send reminder email before scheduled pickup (e.g., 24 hours before). Can be triggered manually or by scheduler.',
  })
  @ApiResponse({
    status: 201,
    type: NotificationResponseDto,
    description: 'Reminder email sent',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - booking not found or no email',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async sendPickupReminder(
    bookingId: string,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.sendPickupReminder(bookingId);
  }
}
