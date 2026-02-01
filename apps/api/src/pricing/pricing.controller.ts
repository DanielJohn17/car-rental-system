import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { PricingService } from './pricing.service';
import { CalculatePricingDto, PricingBreakdownDto } from './dtos';

@ApiTags('pricing')
@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  /**
   * Calculate rental pricing and deposit
   * POST /pricing/calculate
   * Public endpoint - no auth required
   */
  @Post('calculate')
  @ApiOperation({
    summary: 'Calculate rental pricing and deposit',
    description:
      'Calculates the total rental price and 10% deposit amount for a vehicle based on daily rate and rental duration. Public endpoint.',
  })
  @ApiBody({
    type: CalculatePricingDto,
    description: 'Vehicle ID, start date, and end date for pricing calculation',
  })
  @ApiResponse({
    status: 200,
    type: PricingBreakdownDto,
    description:
      'Pricing breakdown with base price, deposit amount, and total price',
  })
  @ApiResponse({
    status: 404,
    description: 'Vehicle not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid date range or past start date',
  })
  async calculatePricing(
    @Body() calculateDto: CalculatePricingDto,
  ): Promise<PricingBreakdownDto> {
    return this.pricingService.calculatePricing(calculateDto);
  }

  /**
   * Get deposit percentage
   * GET /pricing/deposit-percentage
   * Public endpoint - no auth required
   */
  @Get('deposit-percentage')
  @ApiOperation({
    summary: 'Get deposit percentage',
    description:
      'Returns the deposit percentage required for bookings (default: 10%). Public endpoint.',
  })
  @ApiResponse({
    status: 200,
    schema: {
      type: 'object',
      properties: {
        depositPercentage: { type: 'number', example: 10 },
      },
    },
    description: 'Deposit percentage value',
  })
  getDepositPercentage(): { depositPercentage: number } {
    return {
      depositPercentage: this.pricingService.getDepositPercentage(),
    };
  }

  /**
   * Get supported currency
   * GET /pricing/currency
   * Public endpoint - no auth required
   */
  @Get('currency')
  @ApiOperation({
    summary: 'Get supported currency',
    description:
      'Returns the currency code used for pricing (default: USD). Public endpoint.',
  })
  @ApiResponse({
    status: 200,
    schema: {
      type: 'object',
      properties: {
        currency: { type: 'string', example: 'USD' },
      },
    },
    description: 'Currency code',
  })
  getCurrency(): { currency: string } {
    return {
      currency: this.pricingService.getCurrency(),
    };
  }
}
