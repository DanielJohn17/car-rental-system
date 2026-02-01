import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { StripeService } from './services/stripe.service';
import { PaymentStatus } from './entities/payment.entity';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let service: PaymentsService;

  const mockPaymentsService = {
    createPaymentIntent: jest.fn(),
    handlePaymentIntentSucceeded: jest.fn(),
    getPaymentStatus: jest.fn(),
    getPaymentByBookingId: jest.fn(),
    refundPayment: jest.fn(),
  };

  const mockStripeService = {
    constructWebhookEvent: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        {
          provide: PaymentsService,
          useValue: mockPaymentsService,
        },
        {
          provide: StripeService,
          useValue: mockStripeService,
        },
      ],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
    service = module.get<PaymentsService>(PaymentsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createPaymentIntent', () => {
    it('should create payment intent', async () => {
      const mockResponse = {
        clientSecret: 'pi_secret_123',
        paymentIntentId: 'pi_123',
        amount: 1500,
        currency: 'usd',
        status: 'requires_payment_method',
        bookingId: 'booking-123',
      };

      mockPaymentsService.createPaymentIntent.mockResolvedValue(mockResponse);

      const result = await controller.createPaymentIntent({
        bookingId: 'booking-123',
        amount: 1500,
      });

      expect(result).toEqual(mockResponse);
      expect(mockPaymentsService.createPaymentIntent).toHaveBeenCalled();
    });
  });

  describe('getPaymentStatus', () => {
    it('should get payment status', async () => {
      const mockResponse = {
        id: 'payment-123',
        bookingId: 'booking-123',
        amount: 1500,
        status: PaymentStatus.PAID,
        transactionId: 'pi_123',
        paidAt: new Date(),
        createdAt: new Date(),
      };

      mockPaymentsService.getPaymentStatus.mockResolvedValue(mockResponse);

      const result = await controller.getPaymentStatus('payment-123');

      expect(result).toEqual(mockResponse);
    });
  });

  describe('getPaymentByBookingId', () => {
    it('should get payment by booking ID', async () => {
      const mockResponse = {
        id: 'payment-123',
        bookingId: 'booking-123',
        amount: 1500,
        status: PaymentStatus.PAID,
        transactionId: 'pi_123',
        paidAt: new Date(),
        createdAt: new Date(),
      };

      mockPaymentsService.getPaymentByBookingId.mockResolvedValue(mockResponse);

      const result = await controller.getPaymentByBookingId('booking-123');

      expect(result).toEqual(mockResponse);
    });
  });

  describe('refundPayment', () => {
    it('should refund payment', async () => {
      const mockResponse = {
        id: 'payment-123',
        bookingId: 'booking-123',
        amount: 1500,
        status: PaymentStatus.REFUNDED,
        transactionId: 'pi_123',
        paidAt: new Date(),
        createdAt: new Date(),
      };

      mockPaymentsService.refundPayment.mockResolvedValue(mockResponse);

      const result = await controller.refundPayment('booking-123');

      expect(result).toEqual(mockResponse);
    });
  });
});
