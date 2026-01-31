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
import { ApiQuery, ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
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

@ApiTags('vehicles')
@Controller('vehicles')
export class VehicleController {
  constructor(private vehicleService: VehicleService) {}

  /**
   * Search vehicles with filters (PUBLIC)
   */
  @Get('search')
  @ApiOperation({ summary: 'Search vehicles with filters' })
  @ApiQuery({ name: 'make', required: false, description: 'Vehicle make/brand (e.g. Toyota)' })
  @ApiQuery({ name: 'model', required: false, description: 'Vehicle model (e.g. Camry)' })
  @ApiQuery({ name: 'locationId', required: false, description: 'Location/branch UUID' })
  @ApiQuery({ name: 'minDailyRate', required: false, type: Number, description: 'Minimum daily rental rate' })
  @ApiQuery({ name: 'maxDailyRate', required: false, type: Number, description: 'Maximum daily rental rate' })
  @ApiQuery({ name: 'fuelType', required: false, description: 'Fuel type (PETROL, DIESEL, ELECTRIC, HYBRID)' })
  @ApiQuery({ name: 'transmission', required: false, description: 'Transmission type (MANUAL, AUTO)' })
  @ApiQuery({ name: 'minSeats', required: false, type: Number, description: 'Minimum number of seats' })
  @ApiQuery({ name: 'color', required: false, description: 'Vehicle color (e.g. Red, Blue)' })
  @ApiQuery({ name: 'minMileage', required: false, type: Number, description: 'Minimum mileage' })
  @ApiQuery({ name: 'maxMileage', required: false, type: Number, description: 'Maximum mileage' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Results limit (default 20, max 100)' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Results offset for pagination' })
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
   */
  @Post(':id/check-availability')
  @ApiOperation({ summary: 'Check vehicle availability for date range' })
  @ApiParam({ name: 'id', description: 'Vehicle UUID' })
  @ApiBody({
    type: CheckAvailabilityDto,
    examples: {
      example1: {
        value: {
          startDate: '2024-01-01',
          endDate: '2024-01-10',
          locationId: 'uuid-here',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Availability check result' })
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
   */
  @Get('available/search')
  @ApiOperation({ summary: 'Get available vehicles for date range' })
  @ApiQuery({ name: 'startDate', required: true, description: 'Start date (ISO format: 2024-01-01)' })
  @ApiQuery({ name: 'endDate', required: true, description: 'End date (ISO format: 2024-01-10)' })
  @ApiQuery({ name: 'locationId', required: false, description: 'Location/branch UUID (optional)' })
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
   */
  @Post()
  @UseGuards(JwtGuard, createRoleGuard([UserRole.ADMIN, UserRole.SALES]))
  @ApiOperation({ summary: 'Create new vehicle (Admin/Sales only)' })
  @ApiBody({
    type: CreateVehicleDto,
    examples: {
      example1: {
        value: {
          make: 'Toyota',
          model: 'Camry',
          year: 2023,
          licensePlate: 'ABC-1234',
          vin: 'VIN123456789',
          color: 'Red',
          fuelType: 'PETROL',
          transmission: 'AUTO',
          seats: 5,
          dailyRate: 75.5,
          hourlyRate: 12.5,
          locationId: 'uuid-here',
          mileage: 0,
          images: ['url1', 'url2'],
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Vehicle created successfully', type: Vehicle })
  @ApiResponse({ status: 409, description: 'License plate or VIN already exists' })
  async create(@Body() createVehicleDto: CreateVehicleDto): Promise<Vehicle> {
    return this.vehicleService.create(createVehicleDto);
  }

  /**
   * Get all vehicles with pagination (ADMIN/SALES only)
   */
  @Get()
  @UseGuards(JwtGuard, createRoleGuard([UserRole.ADMIN, UserRole.SALES]))
  @ApiOperation({ summary: 'Get all vehicles (Admin/Sales only)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Results limit (default 20)' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Results offset for pagination' })
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
   */
  @Post(':id/maintenance')
  @UseGuards(JwtGuard, createRoleGuard([UserRole.ADMIN, UserRole.SALES]))
  @ApiOperation({ summary: 'Add maintenance record for vehicle (Admin/Sales only)' })
  @ApiParam({ name: 'id', description: 'Vehicle UUID' })
  @ApiBody({
    schema: {
      properties: {
        type: { type: 'string', enum: ['SERVICE', 'REPAIR', 'INSPECTION'], description: 'Maintenance type' },
        cost: { type: 'number', description: 'Cost of maintenance' },
        mileageAtTime: { type: 'number', description: 'Vehicle mileage when maintenance performed' },
        notes: { type: 'string', description: 'Additional notes (optional)' },
      },
      required: ['type', 'cost', 'mileageAtTime'],
    },
    examples: {
      example1: {
        summary: 'Service example',
        value: {
          type: 'SERVICE',
          cost: 150.5,
          mileageAtTime: 50000,
          notes: 'Regular oil change and filter replacement',
        },
      },
      example2: {
        summary: 'Repair example',
        value: {
          type: 'REPAIR',
          cost: 500,
          mileageAtTime: 52000,
          notes: 'Front brake pad replacement',
        },
      },
      example3: {
        summary: 'Inspection example',
        value: {
          type: 'INSPECTION',
          cost: 75,
          mileageAtTime: 55000,
          notes: 'Annual safety inspection completed',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Maintenance record created', type: MaintenanceRecord })
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

