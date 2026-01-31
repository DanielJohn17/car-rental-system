import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { VehicleService } from './vehicle.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { createRoleGuard } from '../auth/guards/role.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../auth/entities/user.entity';
import {
  CreateVehicleDto,
  UpdateVehicleDto,
  SearchVehiclesDto,
  CheckAvailabilityDto,
} from './dtos';
import { Vehicle, VehicleStatus } from './entities/vehicle.entity';
import { MaintenanceRecord } from './entities/maintenance-record.entity';

@Controller('vehicles')
export class VehicleController {
  constructor(private vehicleService: VehicleService) {}

  /**
   * Search vehicles with filters (PUBLIC)
   * GET /vehicles/search?make=Toyota&model=Camry&locationId=...&minDailyRate=50&maxDailyRate=200&color=Red&minMileage=0&maxMileage=50000
   * Query params: make, model, locationId, minDailyRate, maxDailyRate, fuelType, transmission, minSeats, color, minMileage, maxMileage, limit, offset
   */
  @Get('search')
  async search(@Query() searchDto: SearchVehiclesDto) {
    return this.vehicleService.search(searchDto);
  }

  /**
   * Get vehicle by ID (PUBLIC)
   * GET /vehicles/:id
   */
  @Get(':id')
  async getById(@Param('id') id: string): Promise<Vehicle> {
    return this.vehicleService.findById(id);
  }

  /**
   * Check vehicle availability for date range (PUBLIC)
   * POST /vehicles/:id/check-availability
   * Body: { startDate: "2024-01-01", endDate: "2024-01-10", locationId: "..." }
   */
  @Post(':id/check-availability')
  async checkAvailability(
    @Param('id') vehicleId: string,
    @Body() checkDto: CheckAvailabilityDto,
  ) {
    if (new Date(checkDto.startDate) >= new Date(checkDto.endDate)) {
      throw new BadRequestException('Start date must be before end date');
    }
    return this.vehicleService.checkAvailability(vehicleId, checkDto);
  }

  /**
   * Get available vehicles for date range (PUBLIC)
   * GET /vehicles/available?startDate=2024-01-01&endDate=2024-01-10&locationId=...
   */
  @Get('available/search')
  async getAvailableVehicles(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('locationId') locationId?: string,
  ) {
    if (!startDate || !endDate) {
      throw new BadRequestException('startDate and endDate are required');
    }
    if (new Date(startDate) >= new Date(endDate)) {
      throw new BadRequestException('Start date must be before end date');
    }
    return this.vehicleService.getAvailableVehicles(startDate, endDate, locationId);
  }

  /**
   * Create vehicle (ADMIN/SALES only)
   * POST /vehicles
   */
  @Post()
  @UseGuards(JwtGuard, createRoleGuard([UserRole.ADMIN, UserRole.SALES]))
  async create(@Body() createVehicleDto: CreateVehicleDto): Promise<Vehicle> {
    return this.vehicleService.create(createVehicleDto);
  }

  /**
   * Get all vehicles with pagination (ADMIN/SALES only)
   * GET /vehicles?limit=20&offset=0
   */
  @Get()
  @UseGuards(JwtGuard, createRoleGuard([UserRole.ADMIN, UserRole.SALES]))
  async findAll(
    @Query('limit') limit: string = '20',
    @Query('offset') offset: string = '0',
  ) {
    return this.vehicleService.findAll(parseInt(limit), parseInt(offset));
  }

  /**
   * Update vehicle (ADMIN/SALES only)
   * PUT /vehicles/:id
   */
  @Put(':id')
  @UseGuards(JwtGuard, createRoleGuard([UserRole.ADMIN, UserRole.SALES]))
  async update(
    @Param('id') id: string,
    @Body() updateVehicleDto: UpdateVehicleDto,
  ): Promise<Vehicle> {
    return this.vehicleService.update(id, updateVehicleDto);
  }

  /**
   * Delete vehicle (ADMIN only)
   * DELETE /vehicles/:id
   */
  @Delete(':id')
  @UseGuards(JwtGuard, createRoleGuard([UserRole.ADMIN]))
  async delete(@Param('id') id: string): Promise<void> {
    return this.vehicleService.delete(id);
  }

  /**
   * Update vehicle status (ADMIN/SALES only)
   * PATCH /vehicles/:id/status
   * Body: { status: "AVAILABLE" | "MAINTENANCE" | "RENTED" | "DAMAGED" | "RESERVED" }
   */
  @Put(':id/status')
  @UseGuards(JwtGuard, createRoleGuard([UserRole.ADMIN, UserRole.SALES]))
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: VehicleStatus,
  ): Promise<Vehicle> {
    if (!Object.values(VehicleStatus).includes(status)) {
      throw new BadRequestException(`Invalid status: ${status}`);
    }
    return this.vehicleService.updateStatus(id, status);
  }

  /**
   * Update vehicle mileage (ADMIN/SALES only)
   * PUT /vehicles/:id/mileage
   * Body: { mileage: 50000 }
   */
  @Put(':id/mileage')
  @UseGuards(JwtGuard, createRoleGuard([UserRole.ADMIN, UserRole.SALES]))
  async updateMileage(
    @Param('id') id: string,
    @Body('mileage') mileage: number,
  ): Promise<Vehicle> {
    return this.vehicleService.updateMileage(id, mileage);
  }

  /**
   * Get maintenance records for a vehicle (ADMIN/SALES only)
   * GET /vehicles/:id/maintenance
   */
  @Get(':id/maintenance')
  @UseGuards(JwtGuard, createRoleGuard([UserRole.ADMIN, UserRole.SALES]))
  async getMaintenanceRecords(@Param('id') vehicleId: string): Promise<MaintenanceRecord[]> {
    return this.vehicleService.getMaintenanceRecords(vehicleId);
  }

  /**
   * Add maintenance record (ADMIN/SALES only)
   * POST /vehicles/:id/maintenance
   * Body: { type: "SERVICE" | "REPAIR" | "INSPECTION", cost: 100, mileageAtTime: 50000, notes: "..." }
   */
  @Post(':id/maintenance')
  @UseGuards(JwtGuard, createRoleGuard([UserRole.ADMIN, UserRole.SALES]))
  async addMaintenanceRecord(
    @Param('id') vehicleId: string,
    @Body() body: { type: string; cost: number; mileageAtTime: number; notes?: string },
  ): Promise<MaintenanceRecord> {
    return this.vehicleService.addMaintenanceRecord(
      vehicleId,
      body.type,
      body.cost,
      body.mileageAtTime,
      body.notes,
    );
  }
}

