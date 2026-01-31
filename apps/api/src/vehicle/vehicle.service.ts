import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, And, LessThan, MoreThan, In } from 'typeorm';
import { Vehicle, VehicleStatus } from './entities/vehicle.entity';
import { MaintenanceRecord } from './entities/maintenance-record.entity';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import {
  CreateVehicleDto,
  UpdateVehicleDto,
  SearchVehiclesDto,
  CheckAvailabilityDto,
} from './dtos';

@Injectable()
export class VehicleService {
  constructor(
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
    @InjectRepository(MaintenanceRecord)
    private maintenanceRepository: Repository<MaintenanceRecord>,
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
  ) {}

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
  ): Promise<{ data: Vehicle[]; total: number }> {
    const [data, total] = await this.vehicleRepository.findAndCount({
      relations: ['location', 'maintenanceRecords'],
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
    });

    return { data, total };
  }

  /**
   * Search vehicles with filters (Public endpoint)
   */
  async search(
    searchDto: SearchVehiclesDto,
  ): Promise<{ data: Vehicle[]; total: number }> {
    const query = this.vehicleRepository.createQueryBuilder('vehicle');

    // If status not specified, only show available vehicles for public search
    if (!searchDto.status) {
      query.where('vehicle.status = :status', {
        status: VehicleStatus.AVAILABLE,
      });
    } else {
      query.where('vehicle.status = :status', { status: searchDto.status });
    }

    if (searchDto.make) {
      query.andWhere('LOWER(vehicle.make) LIKE LOWER(:make)', {
        make: `%${searchDto.make}%`,
      });
    }

    if (searchDto.model) {
      query.andWhere('LOWER(vehicle.model) LIKE LOWER(:model)', {
        model: `%${searchDto.model}%`,
      });
    }

    if (searchDto.color) {
      query.andWhere('LOWER(vehicle.color) LIKE LOWER(:color)', {
        color: `%${searchDto.color}%`,
      });
    }

    if (searchDto.locationId) {
      query.andWhere('vehicle.locationId = :locationId', {
        locationId: searchDto.locationId,
      });
    }

    if (searchDto.minDailyRate !== undefined) {
      query.andWhere('vehicle.dailyRate >= :minDailyRate', {
        minDailyRate: searchDto.minDailyRate,
      });
    }

    if (searchDto.maxDailyRate !== undefined) {
      query.andWhere('vehicle.dailyRate <= :maxDailyRate', {
        maxDailyRate: searchDto.maxDailyRate,
      });
    }

    if (searchDto.fuelType) {
      query.andWhere('vehicle.fuelType = :fuelType', {
        fuelType: searchDto.fuelType,
      });
    }

    if (searchDto.transmission) {
      query.andWhere('vehicle.transmission = :transmission', {
        transmission: searchDto.transmission,
      });
    }

    if (searchDto.minSeats !== undefined) {
      query.andWhere('vehicle.seats >= :minSeats', {
        minSeats: searchDto.minSeats,
      });
    }

    if (searchDto.minMileage !== undefined) {
      query.andWhere('vehicle.mileage >= :minMileage', {
        minMileage: searchDto.minMileage,
      });
    }

    if (searchDto.maxMileage !== undefined) {
      query.andWhere('vehicle.mileage <= :maxMileage', {
        maxMileage: searchDto.maxMileage,
      });
    }

    query.leftJoinAndSelect('vehicle.location', 'location');
    query.orderBy('vehicle.createdAt', 'DESC');
    query.take(searchDto.limit);
    query.skip(searchDto.offset);

    const [data, total] = await query.getManyAndCount();
    return { data, total };
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

    // Get all vehicles with AVAILABLE status at the location
    let query = this.vehicleRepository
      .createQueryBuilder('vehicle')
      .leftJoinAndSelect('vehicle.location', 'location')
      .where('vehicle.status = :status', { status: VehicleStatus.AVAILABLE });

    if (locationId) {
      query.andWhere('vehicle.locationId = :locationId', { locationId });
    }

    const vehicles = await query.getMany();

    // Filter out vehicles with overlapping bookings
    const availableVehicles: Vehicle[] = [];

    for (const vehicle of vehicles) {
      const overlappingBooking = await this.bookingRepository.findOne({
        where: {
          vehicleId: vehicle.id,
          status: In([
            BookingStatus.PENDING,
            BookingStatus.APPROVED,
            BookingStatus.ONGOING,
          ]),
          startDateTime: LessThan(end),
          endDateTime: MoreThan(start),
        },
      });

      if (!overlappingBooking) {
        availableVehicles.push(vehicle);
      }
    }

    return availableVehicles;
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

    const record = new MaintenanceRecord();
    record.vehicleId = vehicleId;
    record.type = type as any;
    record.cost = cost;
    record.mileageAtTime = mileageAtTime;
    record.notes = notes;

    return this.maintenanceRepository.save(record);
  }
}
