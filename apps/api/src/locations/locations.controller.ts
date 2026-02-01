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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBody,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { LocationsService } from './locations.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { createRoleGuard } from '../auth/guards/role.guard';
import { UserRole } from '../auth/entities/user.entity';
import { CreateLocationDto, UpdateLocationDto } from './dtos';
import { Location } from './entities/location.entity';

@ApiTags('locations')
@Controller('locations')
export class LocationsController {
  constructor(private locationsService: LocationsService) {}

  /**
   * Get all locations (PUBLIC)
   */
  @Get()
  @ApiOperation({ summary: 'Get all locations' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Results limit (default 100)',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Results offset for pagination',
  })
  @ApiResponse({ status: 200, description: 'List of locations' })
  async findAll(
    @Query('limit') limit: string = '100',
    @Query('offset') offset: string = '0',
  ) {
    return this.locationsService.findAll(parseInt(limit), parseInt(offset));
  }

  /**
   * Get location by ID (PUBLIC)
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get location by ID' })
  @ApiParam({ name: 'id', description: 'Location UUID' })
  @ApiResponse({ status: 200, description: 'Location details', type: Location })
  @ApiResponse({ status: 404, description: 'Location not found' })
  async findById(@Param('id') id: string): Promise<Location> {
    return this.locationsService.findById(id);
  }

  /**
   * Search locations by name or address (PUBLIC)
   */
  @Get('search/:name')
  @ApiOperation({ summary: 'Search locations by name or address' })
  @ApiParam({ name: 'name', description: 'Search term (name or address)' })
  @ApiResponse({ status: 200, description: 'Search results' })
  async search(@Param('name') name: string): Promise<Location[]> {
    return this.locationsService.search(name);
  }

  /**
   * Create location (ADMIN only)
   */
  @Post()
  @UseGuards(JwtGuard, createRoleGuard([UserRole.ADMIN]))
  @ApiOperation({ summary: 'Create new location (Admin only)' })
  @ApiBody({
    type: CreateLocationDto,
    examples: {
      example1: {
        value: {
          name: 'Bole Branch',
          address: '123 Main Street, Addis Ababa',
          latitude: 9.0065,
          longitude: 38.7578,
          operatingHours: {
            monday: '08:00-18:00',
            tuesday: '08:00-18:00',
            wednesday: '08:00-18:00',
            thursday: '08:00-18:00',
            friday: '08:00-18:00',
            saturday: '09:00-17:00',
            sunday: 'closed',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Location created', type: Location })
  async create(
    @Body() createLocationDto: CreateLocationDto,
  ): Promise<Location> {
    return this.locationsService.create(createLocationDto);
  }

  /**
   * Update location (ADMIN only)
   */
  @Put(':id')
  @UseGuards(JwtGuard, createRoleGuard([UserRole.ADMIN]))
  @ApiOperation({ summary: 'Update location (Admin only)' })
  @ApiParam({ name: 'id', description: 'Location UUID' })
  @ApiBody({ type: UpdateLocationDto })
  @ApiResponse({ status: 200, description: 'Location updated', type: Location })
  @ApiResponse({ status: 404, description: 'Location not found' })
  async update(
    @Param('id') id: string,
    @Body() updateLocationDto: UpdateLocationDto,
  ): Promise<Location> {
    return this.locationsService.update(id, updateLocationDto);
  }

  /**
   * Delete location (ADMIN only)
   */
  @Delete(':id')
  @UseGuards(JwtGuard, createRoleGuard([UserRole.ADMIN]))
  @ApiOperation({ summary: 'Delete location (Admin only)' })
  @ApiParam({ name: 'id', description: 'Location UUID' })
  @ApiResponse({ status: 200, description: 'Location deleted' })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete location with vehicles',
  })
  @ApiResponse({ status: 404, description: 'Location not found' })
  async delete(@Param('id') id: string): Promise<void> {
    return this.locationsService.delete(id);
  }

  /**
   * Get location with vehicle count (PUBLIC)
   */
  @Get(':id/info')
  @ApiOperation({ summary: 'Get location details with vehicle count' })
  @ApiParam({ name: 'id', description: 'Location UUID' })
  @ApiResponse({ status: 200, description: 'Location with vehicle count' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  async getLocationWithCount(@Param('id') id: string) {
    return this.locationsService.getLocationWithCount(id);
  }
}
