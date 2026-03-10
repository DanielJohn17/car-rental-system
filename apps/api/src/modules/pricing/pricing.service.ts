import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from '../vehicle/entities/vehicle.entity';
import { CalculatePricingDto, PricingBreakdownDto } from './dtos';

@Injectable()
export class PricingService {
  private readonly DEPOSIT_PERCENTAGE = 10;
  private readonly CURRENCY = 'USD';

  constructor(
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
  ) {}

  /**
   * Calculate rental pricing breakdown based on vehicle and duration
   * Returns: dailyRate, duration, basePrice, depositAmount (10%), totalPrice
   */
  async calculatePricing(
    calculateDto: CalculatePricingDto,
  ): Promise<PricingBreakdownDto> {
    // Validate vehicle exists
    const vehicle = await this.vehicleRepository.findOne({
      where: { id: calculateDto.vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException(
        `Vehicle with ID ${calculateDto.vehicleId} not found`,
      );
    }

    // Parse dates
    const startDate = new Date(calculateDto.startDate);
    const endDate = new Date(calculateDto.endDate);

    // Validate dates
    if (startDate >= endDate) {
      throw new BadRequestException('End date must be after start date');
    }

    if (startDate < new Date()) {
      throw new BadRequestException('Start date cannot be in the past');
    }

    // Calculate duration in days (round up)
    const durationMs = endDate.getTime() - startDate.getTime();
    const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));

    // Calculate pricing
    const dailyRate = Number(vehicle.dailyRate);
    const basePrice = dailyRate * durationDays;
    const depositAmount =
      Math.round(((basePrice * this.DEPOSIT_PERCENTAGE) / 100) * 100) / 100; // Round to 2 decimals
    const totalPrice = basePrice;

    return {
      vehicleId: calculateDto.vehicleId,
      startDate: calculateDto.startDate,
      endDate: calculateDto.endDate,
      dailyRate,
      durationDays,
      basePrice: Math.round(basePrice * 100) / 100,
      depositPercentage: this.DEPOSIT_PERCENTAGE,
      depositAmount,
      totalPrice: Math.round(totalPrice * 100) / 100,
      currency: this.CURRENCY,
    };
  }

  /**
   * Get deposit amount for a calculated price
   */
  getDepositAmount(totalPrice: number): number {
    const deposit = (totalPrice * this.DEPOSIT_PERCENTAGE) / 100;
    return Math.round(deposit * 100) / 100;
  }

  /**
   * Get deposit percentage
   */
  getDepositPercentage(): number {
    return this.DEPOSIT_PERCENTAGE;
  }

  /**
   * Get currency
   */
  getCurrency(): string {
    return this.CURRENCY;
  }
}
