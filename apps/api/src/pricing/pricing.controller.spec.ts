import { Test, TestingModule } from '@nestjs/testing';
import { PricingController } from './pricing.controller';
import { PricingService } from './pricing.service';
import { CalculatePricingDto } from './dtos';

describe('PricingController', () => {
  let controller: PricingController;
  let service: PricingService;

  const mockPricingService = {
    calculatePricing: jest.fn(),
    getDepositPercentage: jest.fn(() => 10),
    getCurrency: jest.fn(() => 'USD'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PricingController],
      providers: [
        {
          provide: PricingService,
          useValue: mockPricingService,
        },
      ],
    }).compile();

    controller = module.get<PricingController>(PricingController);
    service = module.get<PricingService>(PricingService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('calculatePricing', () => {
    it('should call pricingService.calculatePricing', async () => {
      const dto: CalculatePricingDto = {
        vehicleId: 'vehicle-123',
        startDate: '2024-12-15T10:00:00Z',
        endDate: '2024-12-18T10:00:00Z',
      };

      const mockResult = {
        vehicleId: 'vehicle-123',
        startDate: '2024-12-15T10:00:00Z',
        endDate: '2024-12-18T10:00:00Z',
        dailyRate: 50,
        durationDays: 3,
        basePrice: 150,
        depositPercentage: 10,
        depositAmount: 15,
        totalPrice: 150,
        currency: 'USD',
      };

      mockPricingService.calculatePricing.mockResolvedValue(mockResult);

      const result = await controller.calculatePricing(dto);

      expect(mockPricingService.calculatePricing).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getDepositPercentage', () => {
    it('should return deposit percentage', () => {
      const result = controller.getDepositPercentage();
      expect(result.depositPercentage).toBe(10);
    });
  });

  describe('getCurrency', () => {
    it('should return currency', () => {
      const result = controller.getCurrency();
      expect(result.currency).toBe('USD');
    });
  });
});
