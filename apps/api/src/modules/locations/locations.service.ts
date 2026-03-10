import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from './entities/location.entity';
import { CreateLocationDto, UpdateLocationDto } from './dtos';

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Location)
    private locationRepository: Repository<Location>,
  ) {}

  /**
   * Get all locations (PUBLIC)
   */
  async findAll(
    limit: number = 100,
    offset: number = 0,
  ): Promise<{ data: Location[]; total: number }> {
    const [data, total] = await this.locationRepository.findAndCount({
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
    });

    return { data, total };
  }

  /**
   * Get location by ID (PUBLIC)
   */
  async findById(id: string): Promise<Location> {
    const location = await this.locationRepository.findOne({
      where: { id },
      relations: ['vehicles'],
    });

    if (!location) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }

    return location;
  }

  /**
   * Search locations by name (PUBLIC)
   */
  async search(name: string): Promise<Location[]> {
    return this.locationRepository
      .createQueryBuilder('location')
      .where('LOWER(location.name) LIKE LOWER(:name)', { name: `%${name}%` })
      .orWhere('LOWER(location.address) LIKE LOWER(:address)', {
        address: `%${name}%`,
      })
      .orderBy('location.name', 'ASC')
      .getMany();
  }

  /**
   * Create location (ADMIN only)
   */
  async create(createLocationDto: CreateLocationDto): Promise<Location> {
    const location = this.locationRepository.create(createLocationDto);
    return this.locationRepository.save(location);
  }

  /**
   * Update location (ADMIN only)
   */
  async update(
    id: string,
    updateLocationDto: UpdateLocationDto,
  ): Promise<Location> {
    const location = await this.findById(id);

    Object.assign(location, updateLocationDto);
    return this.locationRepository.save(location);
  }

  /**
   * Delete location (ADMIN only)
   */
  async delete(id: string): Promise<void> {
    const location = await this.findById(id);

    // Check if location has vehicles
    if (location.vehicles && location.vehicles.length > 0) {
      throw new BadRequestException(
        'Cannot delete location with vehicles. Reassign vehicles first.',
      );
    }

    await this.locationRepository.remove(location);
  }

  /**
   * Get location with vehicle count
   */
  async getLocationWithCount(
    id: string,
  ): Promise<Location & { vehicleCount: number }> {
    const location = await this.locationRepository.findOne({
      where: { id },
      relations: ['vehicles'],
    });

    if (!location) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }

    return {
      ...location,
      vehicleCount: location.vehicles ? location.vehicles.length : 0,
    };
  }
}
