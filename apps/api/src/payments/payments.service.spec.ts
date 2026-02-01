import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { Vehicle } from '../vehicle/entities/vehicle.entity';
import { User } from '../auth/entities/user.entity';
import { StripeService } from './services/stripe.service';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let mockPaymentRepository;
  let mockBookingRepository;
  let mockStripeService;

  const mockBooking = {
    id: 'booking-123',
    vehicleId: 'vehicle-123',
    guestPhone: '1234567890',
    guestEmail: 'guest@example.com',
    startDateTime: new Date('2024-12-20'),
    endDateTime: new Date('2024-12-23'),
    pickupLocationId: 'location-123',
    returnLocationId: 'location-123',
    totalPrice: 150,
    depositAmount: 15,
    status: BookingStatus.PENDING,
    stripePaymentId: null,
    notes: null,
    approvedBy: null,
    actualReturnDateTime: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockPaymentRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    };

    mockBookingRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    mockStripeService = {
      createPaymentIntent: jest.fn(),
      refundPayment: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn((key: string) => {
        const config = {
          STRIPE_ADMIN_ACCOUNT_ID: 'acct_admin123',
          COMMISSION_PERCENTAGE: 10,
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: getRepositoryToken(Payment),
          useValue: mockPaymentRepository,
        },
        {
          provide: getRepositoryToken(Booking),
          useValue: mockBookingRepository,
        },
        {
          provide: getRepositoryToken(Vehicle),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(User),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: StripeService,
          useValue: mockStripeService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPaymentIntent', () => {
    it('should create payment intent for valid booking with vehicle owner', async () => {
      const mockOwner = {
        id: 'user-admin-1',
        stripeConnectAccountId: 'acct_renter123',
      };

      const mockVehicle = {
        id: 'vehicle-123',
        ownerId: 'user-admin-1',
        owner: mockOwner,
      };

      mockBookingRepository.findOne.mockResolvedValue(mockBooking);
      (service as any).vehicleRepository.findOne = jest
        .fn()
        .mockResolvedValue(mockVehicle);

      mockStripeService.createPaymentIntent.mockResolvedValue({
        clientSecret: 'pi_secret_123',
        paymentIntentId: 'pi_123',
        amount: 1500,
        currency: 'usd',
        status: 'requires_payment_method',
      });

      mockPaymentRepository.create.mockReturnValue({
        id: 'payment-123',
        bookingId: mockBooking.id,
        amount: 15,
        status: PaymentStatus.PENDING,
        transactionId: 'pi_123',
        stripeConnectAccountId: 'acct_renter123',
      });

      mockPaymentRepository.save.mockResolvedValue({
        id: 'payment-123',
      });

      const result = await service.createPaymentIntent({
        bookingId: 'booking-123',
        amount: 1500,
      });

      expect(result.paymentIntentId).toBe('pi_123');
      expect(result.clientSecret).toBe('pi_secret_123');
      expect(result.bookingId).toBe('booking-123');
      expect(mockPaymentRepository.save).toHaveBeenCalled();
      // Verify Stripe was called with owner's account
      expect(mockStripeService.createPaymentIntent).toHaveBeenCalledWith(
        expect.objectContaining({
          connectedAccountId: 'acct_renter123',
        }),
      );
    });

    it('should throw NotFoundException when booking not found', async () => {
      mockBookingRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createPaymentIntent({
          bookingId: 'non-existent',
          amount: 1500,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when booking not PENDING', async () => {
      const approvedBooking = {
        ...mockBooking,
        status: BookingStatus.APPROVED,
      };
      mockBookingRepository.findOne.mockResolvedValue(approvedBooking);

      await expect(
        service.createPaymentIntent({
          bookingId: 'booking-123',
          amount: 1500,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when amount does not match deposit', async () => {
      mockBookingRepository.findOne.mockResolvedValue(mockBooking);

      await expect(
        service.createPaymentIntent({
          bookingId: 'booking-123',
          amount: 2000, // Wrong amount
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('handlePaymentIntentSucceeded', () => {
    it('should update payment status and approve booking', async () => {
      const payment = {
        id: 'payment-123',
        bookingId: 'booking-123',
        status: PaymentStatus.PENDING,
        transactionId: 'pi_123',
        paidAt: null,
      };

      mockPaymentRepository.findOne.mockResolvedValue(payment);
      mockBookingRepository.findOne.mockResolvedValue(mockBooking);

      const payload = {
        id: 'evt_123',
        object: 'event',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_123',
            status: 'succeeded',
            metadata: { bookingId: 'booking-123' },
          },
        },
      } as any;

      await service.handlePaymentIntentSucceeded(payload);

      expect(mockPaymentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: PaymentStatus.PAID,
        }),
      );

      expect(mockBookingRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: BookingStatus.APPROVED,
        }),
      );
    });
  });

  describe('getPaymentStatus', () => {
    it('should return payment status', async () => {
      const payment = {
        id: 'payment-123',
        bookingId: 'booking-123',
        amount: 15,
        status: PaymentStatus.PAID,
        transactionId: 'pi_123',
        paidAt: new Date(),
        createdAt: new Date(),
      };

      mockPaymentRepository.findOne.mockResolvedValue(payment);

      const result = await service.getPaymentStatus('payment-123');

      expect(result.id).toBe('payment-123');
      expect(result.status).toBe(PaymentStatus.PAID);
    });

    it('should throw NotFoundException when payment not found', async () => {
      mockPaymentRepository.findOne.mockResolvedValue(null);

      await expect(service.getPaymentStatus('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getPaymentByBookingId', () => {
    it('should return payment by booking ID', async () => {
      const payment = {
        id: 'payment-123',
        bookingId: 'booking-123',
        amount: 15,
        status: PaymentStatus.PAID,
        transactionId: 'pi_123',
        paidAt: new Date(),
        createdAt: new Date(),
      };

      mockPaymentRepository.findOne.mockResolvedValue(payment);

      const result = await service.getPaymentByBookingId('booking-123');

      expect(result.bookingId).toBe('booking-123');
      expect(result.status).toBe(PaymentStatus.PAID);
    });
  });

  describe('refundPayment', () => {
    it('should refund paid payment', async () => {
      const payment = {
        id: 'payment-123',
        bookingId: 'booking-123',
        amount: 15,
        status: PaymentStatus.PAID,
        transactionId: 'pi_123',
        paidAt: new Date(),
        createdAt: new Date(),
      };

      mockPaymentRepository.findOne.mockResolvedValue(payment);
      mockStripeService.refundPayment.mockResolvedValue({ id: 'refund_123' });
      mockBookingRepository.findOne.mockResolvedValue(mockBooking);

      const result = await service.refundPayment('booking-123');

      expect(mockStripeService.refundPayment).toHaveBeenCalledWith('pi_123');
      expect(result.status).toBe(PaymentStatus.REFUNDED);
    });

    it('should throw BadRequestException when payment not PAID', async () => {
      const payment = {
        id: 'payment-123',
        bookingId: 'booking-123',
        status: PaymentStatus.PENDING,
        transactionId: 'pi_123',
      };

      mockPaymentRepository.findOne.mockResolvedValue(payment);

      await expect(service.refundPayment('booking-123')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
