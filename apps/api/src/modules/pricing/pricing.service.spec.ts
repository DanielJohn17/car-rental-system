import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { Vehicle } from '../vehicle/entities/vehicle.entity';
import { CalculatePricingDto } from './dtos';

describe('PricingService', () => {
  let service: PricingService;
  let mockVehicleRepository;

  const mockVehicle = {
    id: 'vehicle-123',
    make: 'Toyota',
    model: 'Camry',
    year: 2023,
    licensePlate: 'ABC123',
    dailyRate: 50,
    status: 'AVAILABLE',
  };

  beforeEach(async () => {
    mockVehicleRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PricingService,
        {
          provide: getRepositoryToken(Vehicle),
          useValue: mockVehicleRepository,
        },
      ],
    }).compile();

    service = module.get<PricingService>(PricingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculatePricing', () => {
    it('should calculate pricing for a valid booking', async () => {
      mockVehicleRepository.findOne.mockResolvedValue(mockVehicle);

      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 3); // 3 days

      const dto: CalculatePricingDto = {
        vehicleId: 'vehicle-123',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };

      const result = await service.calculatePricing(dto);

      expect(result).toBeDefined();
      expect(result.vehicleId).toBe('vehicle-123');
      expect(result.dailyRate).toBe(50);
      expect(result.durationDays).toBe(3);
      expect(result.basePrice).toBe(150);
      expect(result.depositAmount).toBe(15);
      expect(result.totalPrice).toBe(150);
      expect(result.depositPercentage).toBe(10);
      expect(result.currency).toBe('USD');
    });

    it('should throw NotFoundException when vehicle does not exist', async () => {
      mockVehicleRepository.findOne.mockResolvedValue(null);

      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);

      const dto: CalculatePricingDto = {
        vehicleId: 'non-existent',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };

      await expect(service.calculatePricing(dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when end date is before start date', async () => {
      mockVehicleRepository.findOne.mockResolvedValue(mockVehicle);

      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 3);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 1);

      const dto: CalculatePricingDto = {
        vehicleId: 'vehicle-123',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };

      await expect(service.calculatePricing(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when start date is in the past', async () => {
      mockVehicleRepository.findOne.mockResolvedValue(mockVehicle);

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 1); // Yesterday
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 1);

      const dto: CalculatePricingDto = {
        vehicleId: 'vehicle-123',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };

      await expect(service.calculatePricing(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should calculate deposit amount as 10% of total price', async () => {
      mockVehicleRepository.findOne.mockResolvedValue({
        ...mockVehicle,
        dailyRate: 100,
      });

      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 5); // 5 days

      const dto: CalculatePricingDto = {
        vehicleId: 'vehicle-123',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };

      const result = await service.calculatePricing(dto);

      expect(result.basePrice).toBe(500);
      expect(result.depositAmount).toBe(50);
      expect(result.totalPrice).toBe(500);
    });
  });

  describe('getDepositAmount', () => {
    it('should return 10% of total price', () => {
      const deposit = service.getDepositAmount(100);
      expect(deposit).toBe(10);
    });

    it('should round to 2 decimals', () => {
      const deposit = service.getDepositAmount(33.33);
      expect(deposit).toBe(3.33);
    });
  });

  describe('getDepositPercentage', () => {
    it('should return deposit percentage', () => {
      expect(service.getDepositPercentage()).toBe(10);
    });
  });

  describe('getCurrency', () => {
    it('should return currency', () => {
      expect(service.getCurrency()).toBe('USD');
    });
  });
});
