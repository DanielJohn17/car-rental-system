import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface ResendEmailParams {
  from: string;
  to: string;
  subject: string;
  html: string;
}

interface ResendEmailResponse {
  id: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resendApiKey: string;
  private readonly fromEmail: string;
  private readonly apiBaseUrl = 'https://api.resend.com/emails';

  constructor(private configService: ConfigService) {
    this.resendApiKey = this.configService.get<string>('RESEND_API_KEY') || '';
    this.fromEmail =
      this.configService.get<string>('EMAIL_FROM') || 'noreply@carrental.com';

    if (!this.resendApiKey) {
      this.logger.warn(
        'RESEND_API_KEY not configured. Email functionality will be disabled.',
      );
    }
  }

  /**
   * Send email using Resend API
   */
  async send(params: ResendEmailParams): Promise<{ messageId: string }> {
    // Validate email configuration
    if (!this.resendApiKey) {
      this.logger.error('Resend API key not configured');
      throw new InternalServerErrorException('Email service not configured');
    }

    // Validate recipient email
    if (!this.isValidEmail(params.to)) {
      this.logger.error(`Invalid email address: ${params.to}`);
      throw new InternalServerErrorException('Invalid recipient email address');
    }

    try {
      const response = await fetch(this.apiBaseUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: params.from || this.fromEmail,
          to: params.to,
          subject: params.subject,
          html: params.html,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        this.logger.error(`Resend API error: ${response.status}`, errorData);

        // Handle specific Resend errors
        if (response.status === 401) {
          throw new InternalServerErrorException('Invalid Resend API key');
        }

        if (response.status === 429) {
          throw new InternalServerErrorException('Email rate limit exceeded');
        }

        throw new InternalServerErrorException('Failed to send email');
      }

      const data: ResendEmailResponse = await response.json();

      this.logger.log(`Email sent successfully: ${data.id} to ${params.to}`);

      return {
        messageId: data.id,
      };
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }

      this.logger.error(
        'Failed to send email',
        error instanceof Error ? error.message : error,
      );

      throw new InternalServerErrorException('Failed to send email');
    }
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Generate booking confirmation email HTML
   */
  generateBookingConfirmationHtml(data: {
    guestName: string;
    bookingReference: string;
    vehicleDetails: string;
    pickupLocation: string;
    pickupDate: string;
    returnDate: string;
    totalPrice: number;
    depositAmount: number;
    depositPaid: boolean;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; }
            .header { background-color: #f8f9fa; padding: 20px; text-align: center; }
            .content { padding: 20px 0; }
            .detail { margin: 10px 0; }
            .label { font-weight: bold; }
            .badge { display: inline-block; padding: 5px 10px; border-radius: 4px; font-size: 12px; }
            .badge-success { background-color: #d4edda; color: #155724; }
            .footer { background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Booking Confirmation</h1>
            </div>
            <div class="content">
              <p>Dear <strong>${data.guestName}</strong>,</p>
              
              <p>Thank you for your booking! We're excited to have you. Here are your booking details:</p>
              
              <div class="detail">
                <span class="label">Booking Reference:</span> ${data.bookingReference}
              </div>
              
              <div class="detail">
                <span class="label">Vehicle:</span> ${data.vehicleDetails}
              </div>
              
              <div class="detail">
                <span class="label">Pickup Location:</span> ${data.pickupLocation}
              </div>
              
              <div class="detail">
                <span class="label">Pickup Date & Time:</span> ${data.pickupDate}
              </div>
              
              <div class="detail">
                <span class="label">Return Date & Time:</span> ${data.returnDate}
              </div>
              
              <div class="detail">
                <span class="label">Total Price:</span> $${data.totalPrice.toFixed(2)}
              </div>
              
              <div class="detail">
                <span class="label">Deposit Amount:</span> $${data.depositAmount.toFixed(2)}
                ${data.depositPaid ? '<span class="badge badge-success">✓ Paid</span>' : ''}
              </div>
              
              <p><strong>Next Steps:</strong></p>
              <ol>
                <li>Our team will review your booking within 24 hours</li>
                <li>We'll contact you to confirm final details</li>
                <li>Please prepare required documents (valid ID, insurance)</li>
              </ol>
              
              <p>If you have any questions, please don't hesitate to contact us.</p>
              
              <p>Best regards,<br>The Car Rental Team</p>
            </div>
            <div class="footer">
              <p>© 2024 Car Rental System. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate booking approved email HTML
   */
  generateApprovedHtml(data: {
    guestName: string;
    bookingReference: string;
    vehicleDetails: string;
    pickupLocation: string;
    pickupDate: string;
    notes?: string;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; }
            .header { background-color: #d4edda; padding: 20px; text-align: center; border-bottom: 3px solid #28a745; }
            .content { padding: 20px 0; }
            .detail { margin: 10px 0; }
            .label { font-weight: bold; }
            .footer { background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="color: #28a745; margin: 0;">✓ Booking Approved!</h1>
            </div>
            <div class="content">
              <p>Dear <strong>${data.guestName}</strong>,</p>
              
              <p>Great news! Your booking has been approved and is confirmed.</p>
              
              <div class="detail">
                <span class="label">Booking Reference:</span> ${data.bookingReference}
              </div>
              
              <div class="detail">
                <span class="label">Vehicle:</span> ${data.vehicleDetails}
              </div>
              
              <div class="detail">
                <span class="label">Pickup Location:</span> ${data.pickupLocation}
              </div>
              
              <div class="detail">
                <span class="label">Pickup Date & Time:</span> ${data.pickupDate}
              </div>
              
              ${data.notes ? `<p><strong>Important Notes:</strong></p><p>${data.notes}</p>` : ''}
              
              <p><strong>Please remember to:</strong></p>
              <ul>
                <li>Bring a valid government-issued ID</li>
                <li>Bring proof of insurance or our insurance option</li>
                <li>Arrive 15 minutes early for check-in</li>
              </ul>
              
              <p>We look forward to seeing you soon!</p>
              
              <p>Best regards,<br>The Car Rental Team</p>
            </div>
            <div class="footer">
              <p>© 2024 Car Rental System. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate booking rejected email HTML
   */
  generateRejectedHtml(data: {
    guestName: string;
    bookingReference: string;
    reason?: string;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; }
            .header { background-color: #f8d7da; padding: 20px; text-align: center; border-bottom: 3px solid #dc3545; }
            .content { padding: 20px 0; }
            .detail { margin: 10px 0; }
            .label { font-weight: bold; }
            .footer { background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="color: #dc3545; margin: 0;">Booking Status Update</h1>
            </div>
            <div class="content">
              <p>Dear <strong>${data.guestName}</strong>,</p>
              
              <p>Unfortunately, your booking has been rejected.</p>
              
              <div class="detail">
                <span class="label">Booking Reference:</span> ${data.bookingReference}
              </div>
              
              ${data.reason ? `<p><strong>Reason:</strong><br>${data.reason}</p>` : ''}
              
              <p>We sincerely apologize for any inconvenience. Please try booking a different vehicle or dates, or contact us for assistance.</p>
              
              <p>Best regards,<br>The Car Rental Team</p>
            </div>
            <div class="footer">
              <p>© 2024 Car Rental System. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate booking completion email HTML
   */
  generateCompletionHtml(data: {
    guestName: string;
    bookingReference: string;
    vehicleDetails: string;
    returnDate: string;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; }
            .header { background-color: #e7f3ff; padding: 20px; text-align: center; }
            .content { padding: 20px 0; }
            .detail { margin: 10px 0; }
            .label { font-weight: bold; }
            .footer { background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Rental Complete</h1>
            </div>
            <div class="content">
              <p>Dear <strong>${data.guestName}</strong>,</p>
              
              <p>Thank you for renting with us! Your rental has been completed and processed.</p>
              
              <div class="detail">
                <span class="label">Booking Reference:</span> ${data.bookingReference}
              </div>
              
              <div class="detail">
                <span class="label">Vehicle:</span> ${data.vehicleDetails}
              </div>
              
              <div class="detail">
                <span class="label">Return Date & Time:</span> ${data.returnDate}
              </div>
              
              <p><strong>Thank you for choosing us!</strong></p>
              
              <p>We hope you had a great experience. We look forward to serving you again in the future.</p>
              
              <p>Best regards,<br>The Car Rental Team</p>
            </div>
            <div class="footer">
              <p>© 2024 Car Rental System. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}
