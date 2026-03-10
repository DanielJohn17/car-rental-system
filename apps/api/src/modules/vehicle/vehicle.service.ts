import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Repository, LessThan, MoreThan, In } from 'typeorm';
import { Vehicle, VehicleStatus } from './entities/vehicle.entity';
import {
  MaintenanceRecord,
  MaintenanceType,
} from './entities/maintenance-record.entity';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import {
  CreateVehicleDto,
  UpdateVehicleDto,
  SearchVehiclesDto,
  CheckAvailabilityDto,
} from './dtos';
import type { LimitOffsetPaginatedResponse } from '../../core/pagination/limit-offset-paginated-response.type';
import { createLimitOffsetPaginatedResponse } from '../../core/pagination/create-limit-offset-paginated-response';
import { normalizeLimitOffsetPagination } from '../../core/pagination/normalize-limit-offset-pagination';

@Injectable()
export class VehicleService {
  constructor(
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
    @InjectRepository(MaintenanceRecord)
    private maintenanceRepository: Repository<MaintenanceRecord>,
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  private readonly publicSearchCacheTtlSeconds: number = 60;

  /**
   * Create a new vehicle (Admin/Sales only)
   */
  async create(createVehicleDto: CreateVehicleDto): Promise<Vehicle> {
    // Check for duplicate license plate and VIN
    const existingVehicle = await this.vehicleRepository.findOne({
      where: [
        { licensePlate: createVehicleDto.licensePlate },
        { vin: createVehicleDto.vin },
      ],
    });

    if (existingVehicle) {
      throw new ConflictException(
        'Vehicle with this license plate or VIN already exists',
      );
    }

    const vehicle = this.vehicleRepository.create(createVehicleDto);
    return this.vehicleRepository.save(vehicle);
  }

  /**
   * Get all vehicles with pagination and relations
   */
  async findAll(
    limit: number = 20,
    offset: number = 0,
  ): Promise<LimitOffsetPaginatedResponse<Vehicle>> {
    const pagination = normalizeLimitOffsetPagination({ limit, offset });
    const [data, total] = await this.vehicleRepository.findAndCount({
      relations: ['location', 'maintenanceRecords'],
      take: pagination.limit,
      skip: pagination.offset,
      order: { createdAt: 'DESC' },
    });

    return createLimitOffsetPaginatedResponse({
      data,
      total,
      limit: pagination.limit,
      offset: pagination.offset,
    });
  }

  /**
   * Search vehicles with filters (Public endpoint)
   */
  async search(
    searchDto: SearchVehiclesDto,
  ): Promise<LimitOffsetPaginatedResponse<Vehicle>> {
    const pagination = normalizeLimitOffsetPagination(searchDto);
    const normalizedSearchDto: SearchVehiclesDto = {
      ...searchDto,
      limit: pagination.limit,
      offset: pagination.offset,
    };
    const cacheKey: string = `vehicle:search:${JSON.stringify(normalizedSearchDto)}`;
    const cached =
      await this.cacheManager.get<LimitOffsetPaginatedResponse<Vehicle>>(
        cacheKey,
      );
    if (cached) {
      return cached;
    }
    const query = this.vehicleRepository.createQueryBuilder('vehicle');

    // If status not specified, only show available vehicles for public search
    if (!normalizedSearchDto.status) {
      query.where('vehicle.status = :status', {
        status: VehicleStatus.AVAILABLE,
      });
    } else {
      query.where('vehicle.status = :status', {
        status: normalizedSearchDto.status,
      });
    }

    if (normalizedSearchDto.make) {
      query.andWhere('LOWER(vehicle.make) LIKE LOWER(:make)', {
        make: `%${normalizedSearchDto.make}%`,
      });
    }

    if (normalizedSearchDto.model) {
      query.andWhere('LOWER(vehicle.model) LIKE LOWER(:model)', {
        model: `%${normalizedSearchDto.model}%`,
      });
    }

    if (normalizedSearchDto.color) {
      query.andWhere('LOWER(vehicle.color) LIKE LOWER(:color)', {
        color: `%${normalizedSearchDto.color}%`,
      });
    }

    if (normalizedSearchDto.locationId) {
      query.andWhere('vehicle.locationId = :locationId', {
        locationId: normalizedSearchDto.locationId,
      });
    }

    if (normalizedSearchDto.minDailyRate !== undefined) {
      query.andWhere('vehicle.dailyRate >= :minDailyRate', {
        minDailyRate: normalizedSearchDto.minDailyRate,
      });
    }

    if (normalizedSearchDto.maxDailyRate !== undefined) {
      query.andWhere('vehicle.dailyRate <= :maxDailyRate', {
        maxDailyRate: normalizedSearchDto.maxDailyRate,
      });
    }

    if (normalizedSearchDto.fuelType) {
      query.andWhere('vehicle.fuelType = :fuelType', {
        fuelType: normalizedSearchDto.fuelType,
      });
    }

    if (normalizedSearchDto.transmission) {
      query.andWhere('vehicle.transmission = :transmission', {
        transmission: normalizedSearchDto.transmission,
      });
    }

    if (normalizedSearchDto.minSeats !== undefined) {
      query.andWhere('vehicle.seats >= :minSeats', {
        minSeats: normalizedSearchDto.minSeats,
      });
    }

    if (normalizedSearchDto.minMileage !== undefined) {
      query.andWhere('vehicle.mileage >= :minMileage', {
        minMileage: normalizedSearchDto.minMileage,
      });
    }

    if (normalizedSearchDto.maxMileage !== undefined) {
      query.andWhere('vehicle.mileage <= :maxMileage', {
        maxMileage: normalizedSearchDto.maxMileage,
      });
    }

    query.leftJoinAndSelect('vehicle.location', 'location');
    query.orderBy('vehicle.createdAt', 'DESC');
    query.take(pagination.limit);
    query.skip(pagination.offset);

    const [data, total] = await query.getManyAndCount();
    const response = createLimitOffsetPaginatedResponse({
      data,
      total,
      limit: pagination.limit,
      offset: pagination.offset,
    });
    await this.cacheManager.set(
      cacheKey,
      response,
      this.publicSearchCacheTtlSeconds,
    );
    return response;
  }

  /**
   * Get vehicle by ID
   */
  async findById(id: string): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id },
      relations: ['location', 'maintenanceRecords', 'bookings'],
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }

    return vehicle;
  }

  /**
   * Update vehicle (Admin/Sales only)
   */
  async update(
    id: string,
    updateVehicleDto: UpdateVehicleDto,
  ): Promise<Vehicle> {
    const vehicle = await this.findById(id);

    // Check for duplicate license plate or VIN if being updated
    if (
      updateVehicleDto.licensePlate &&
      updateVehicleDto.licensePlate !== vehicle.licensePlate
    ) {
      const existing = await this.vehicleRepository.findOne({
        where: { licensePlate: updateVehicleDto.licensePlate },
      });
      if (existing) {
        throw new ConflictException('License plate already in use');
      }
    }

    if (updateVehicleDto.vin && updateVehicleDto.vin !== vehicle.vin) {
      const existing = await this.vehicleRepository.findOne({
        where: { vin: updateVehicleDto.vin },
      });
      if (existing) {
        throw new ConflictException('VIN already in use');
      }
    }

    Object.assign(vehicle, updateVehicleDto);
    return this.vehicleRepository.save(vehicle);
  }

  /**
   * Delete vehicle (Admin only)
   */
  async delete(id: string): Promise<void> {
    const vehicle = await this.findById(id);

    // Check if vehicle has active bookings
    const activeBookings = await this.bookingRepository.count({
      where: {
        vehicleId: id,
        status: In([
          BookingStatus.PENDING,
          BookingStatus.APPROVED,
          BookingStatus.ONGOING,
        ]),
      },
    });

    if (activeBookings > 0) {
      throw new BadRequestException(
        'Cannot delete vehicle with active bookings',
      );
    }

    await this.vehicleRepository.remove(vehicle);
  }

  /**
   * Check vehicle availability for a date range and location (Public endpoint)
   */
  async checkAvailability(
    vehicleId: string,
    checkDto: CheckAvailabilityDto,
  ): Promise<{
    available: boolean;
    reason?: string;
  }> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${vehicleId} not found`);
    }

    // Check vehicle status
    if (vehicle.status !== VehicleStatus.AVAILABLE) {
      return {
        available: false,
        reason: `Vehicle is currently ${vehicle.status}`,
      };
    }

    // Check if pickup location matches (if specified in check)
    if (checkDto.locationId && vehicle.locationId !== checkDto.locationId) {
      return {
        available: false,
        reason: 'Vehicle is not available at requested location',
      };
    }

    // Check for overlapping bookings
    const startDate = new Date(checkDto.startDate);
    const endDate = new Date(checkDto.endDate);

    const overlappingBooking = await this.bookingRepository.findOne({
      where: {
        vehicleId,
        status: In([
          BookingStatus.PENDING,
          BookingStatus.APPROVED,
          BookingStatus.ONGOING,
        ]),
        startDateTime: LessThan(endDate),
        endDateTime: MoreThan(startDate),
      },
    });

    if (overlappingBooking) {
      return {
        available: false,
        reason: 'Vehicle is booked for requested dates',
      };
    }

    return { available: true };
  }

  /**
   * Get available vehicles for a date range and location
   */
  async getAvailableVehicles(
    startDate: string,
    endDate: string,
    locationId?: string,
  ): Promise<Vehicle[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const blockingStatuses: BookingStatus[] = [
      BookingStatus.PENDING,
      BookingStatus.APPROVED,
      BookingStatus.ONGOING,
    ];

    const query = this.vehicleRepository
      .createQueryBuilder('vehicle')
      .leftJoinAndSelect('vehicle.location', 'location')
      .leftJoin(
        'vehicle.bookings',
        'booking',
        'booking.status IN (:...blockingStatuses) AND booking.startDateTime < :end AND booking.endDateTime > :start',
        { blockingStatuses, start, end },
      )
      .where('vehicle.status = :status', { status: VehicleStatus.AVAILABLE })
      .andWhere('booking.id IS NULL');

    if (locationId) {
      query.andWhere('vehicle.locationId = :locationId', { locationId });
    }

    return query.getMany();
  }

  /**
   * Update vehicle status (Admin/Sales only)
   */
  async updateStatus(id: string, status: VehicleStatus): Promise<Vehicle> {
    const vehicle = await this.findById(id);
    vehicle.status = status;
    return this.vehicleRepository.save(vehicle);
  }

  /**
   * Update vehicle mileage (Admin/Sales only)
   */
  async updateMileage(id: string, mileage: number): Promise<Vehicle> {
    if (mileage < 0) {
      throw new BadRequestException('Mileage cannot be negative');
    }

    const vehicle = await this.findById(id);

    if (mileage < vehicle.mileage) {
      throw new BadRequestException('Mileage cannot decrease');
    }

    vehicle.mileage = mileage;
    return this.vehicleRepository.save(vehicle);
  }

  /**
   * Get maintenance records for a vehicle (Admin/Sales only)
   */
  async getMaintenanceRecords(vehicleId: string): Promise<MaintenanceRecord[]> {
    const vehicle = await this.findById(vehicleId);

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    return this.maintenanceRepository.find({
      where: { vehicleId },
      order: { date: 'DESC' },
    });
  }

  /**
   * Add maintenance record (Admin/Sales only)
   */
  async addMaintenanceRecord(
    vehicleId: string,
    type: string,
    cost: number,
    mileageAtTime: number,
    notes?: string,
  ): Promise<MaintenanceRecord> {
    const vehicle = await this.findById(vehicleId);

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    if (mileageAtTime < vehicle.mileage) {
      throw new BadRequestException('Mileage at time cannot decrease');
    }

    const record = new MaintenanceRecord();
    record.vehicleId = vehicleId;
    record.type = type as MaintenanceType;
    record.cost = cost;
    record.mileageAtTime = mileageAtTime;
    record.notes = notes;

    return this.maintenanceRepository.save(record);
  }
}
