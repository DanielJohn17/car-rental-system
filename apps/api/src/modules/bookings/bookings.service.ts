import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThan, MoreThan } from 'typeorm';
import { Booking, BookingStatus } from './entities/booking.entity';
import { Vehicle, VehicleStatus } from '../vehicle/entities/vehicle.entity';
import { Location } from '../locations/entities/location.entity';
import { CreateBookingDto, UpdateBookingStatusDto } from './dtos';
import type { LimitOffsetPaginatedResponse } from '../../core/pagination/limit-offset-paginated-response.type';
import { createLimitOffsetPaginatedResponse } from '../../core/pagination/create-limit-offset-paginated-response';
import { normalizeLimitOffsetPagination } from '../../core/pagination/normalize-limit-offset-pagination';

const ALLOWED_BOOKING_STATUS_TRANSITIONS: Record<
  BookingStatus,
  BookingStatus[]
> = {
  [BookingStatus.PENDING]: [BookingStatus.APPROVED, BookingStatus.CANCELLED],
  [BookingStatus.APPROVED]: [BookingStatus.ONGOING, BookingStatus.CANCELLED],
  [BookingStatus.ONGOING]: [BookingStatus.COMPLETED, BookingStatus.OVERDUE],
  [BookingStatus.COMPLETED]: [],
  [BookingStatus.CANCELLED]: [],
  [BookingStatus.OVERDUE]: [BookingStatus.COMPLETED],
};

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
  ) {}

  /**
   * Create booking (PUBLIC - anonymous)
   * Validates: vehicle exists, location exists, dates valid, availability
   */
  async create(createBookingDto: CreateBookingDto): Promise<Booking> {
    const { startDate, endDate } = this.parseBookingDates(createBookingDto);
    this.validateBookingDates(startDate, endDate);
    const vehicle: Vehicle = await this.getVehicleOrThrow(
      createBookingDto.vehicleId,
    );
    this.validateVehicleAvailability(vehicle);
    await this.getLocationOrThrow(createBookingDto.pickupLocationId, 'Pickup');
    await this.getLocationOrThrow(createBookingDto.returnLocationId, 'Return');
    await this.ensureNoOverlappingBooking(
      createBookingDto.vehicleId,
      startDate,
      endDate,
    );
    this.validatePricing(
      createBookingDto.depositAmount,
      createBookingDto.totalPrice,
    );
    const booking: Booking = this.bookingRepository.create({
      ...createBookingDto,
      startDateTime: startDate,
      endDateTime: endDate,
      status: BookingStatus.PENDING,
    });
    return this.bookingRepository.save(booking);
  }

  private parseBookingDates(createBookingDto: CreateBookingDto): {
    startDate: Date;
    endDate: Date;
  } {
    return {
      startDate: new Date(createBookingDto.startDateTime),
      endDate: new Date(createBookingDto.endDateTime),
    };
  }

  private validateBookingDates(startDate: Date, endDate: Date): void {
    if (startDate >= endDate) {
      throw new BadRequestException('Start date must be before end date');
    }
    if (startDate < new Date()) {
      throw new BadRequestException('Start date cannot be in the past');
    }
  }

  private async getVehicleOrThrow(vehicleId: string): Promise<Vehicle> {
    const vehicle: Vehicle | null = await this.vehicleRepository.findOne({
      where: { id: vehicleId },
    });
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }
    return vehicle;
  }

  private validateVehicleAvailability(vehicle: Vehicle): void {
    if (vehicle.status !== VehicleStatus.AVAILABLE) {
      throw new BadRequestException(
        `Vehicle is currently ${vehicle.status} and cannot be booked`,
      );
    }
  }

  private async getLocationOrThrow(
    locationId: string,
    label: string,
  ): Promise<Location> {
    const location: Location | null = await this.locationRepository.findOne({
      where: { id: locationId },
    });
    if (!location) {
      throw new NotFoundException(`${label} location not found`);
    }
    return location;
  }

  private async ensureNoOverlappingBooking(
    vehicleId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<void> {
    const overlappingBooking: Booking | null =
      await this.bookingRepository.findOne({
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
      throw new BadRequestException(
        'Vehicle is not available for the selected dates',
      );
    }
  }

  private validatePricing(depositAmount: number, totalPrice: number): void {
    if (depositAmount > totalPrice) {
      throw new BadRequestException('Deposit amount cannot exceed total price');
    }
  }

  /**
   * Get all bookings with filtering (ADMIN/SALES)
   */
  async findAll(
    status?: BookingStatus,
    limit: number = 20,
    offset: number = 0,
  ): Promise<LimitOffsetPaginatedResponse<Booking>> {
    const pagination = normalizeLimitOffsetPagination({ limit, offset });
    const query = this.bookingRepository.createQueryBuilder('booking');

    if (status) {
      query.where('booking.status = :status', { status });
    }

    query.leftJoinAndSelect('booking.vehicle', 'vehicle');
    query.leftJoinAndSelect('booking.pickupLocation', 'pickupLocation');
    query.leftJoinAndSelect('booking.approver', 'approver');
    query.orderBy('booking.createdAt', 'DESC');
    query.take(pagination.limit);
    query.skip(pagination.offset);

    const [data, total] = await query.getManyAndCount();
    return createLimitOffsetPaginatedResponse({
      data,
      total,
      limit: pagination.limit,
      offset: pagination.offset,
    });
  }

  /**
   * Get pending bookings (ADMIN/SALES)
   */
  async getPendingBookings(): Promise<Booking[]> {
    return this.bookingRepository.find({
      where: { status: BookingStatus.PENDING },
      relations: ['vehicle', 'pickupLocation', 'approver'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get booking by ID (ADMIN/SALES)
   */
  async findById(id: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['vehicle', 'pickupLocation', 'returnLocation', 'approver'],
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    return booking;
  }

  /**
   * Approve booking (ADMIN/SALES)
   */
  async approve(
    id: string,
    approverId: string,
    notes?: string,
  ): Promise<Booking> {
    const booking = await this.findById(id);

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException(
        `Cannot approve booking with status ${booking.status}. Only PENDING bookings can be approved.`,
      );
    }

    booking.status = BookingStatus.APPROVED;
    booking.approvedBy = approverId;
    if (notes) {
      booking.notes = notes;
    }

    return this.bookingRepository.save(booking);
  }

  /**
   * Reject booking (ADMIN/SALES)
   */
  async reject(
    id: string,
    approverId: string,
    notes?: string,
  ): Promise<Booking> {
    const booking = await this.findById(id);

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException(
        `Cannot reject booking with status ${booking.status}. Only PENDING bookings can be rejected.`,
      );
    }

    booking.status = BookingStatus.CANCELLED;
    booking.approvedBy = approverId;
    booking.notes = notes || 'Booking rejected by staff';

    return this.bookingRepository.save(booking);
  }

  /**
   * Update booking status (ADMIN/SALES)
   */
  async updateStatus(
    id: string,
    updateDto: UpdateBookingStatusDto,
    userId: string,
  ): Promise<Booking> {
    const booking = await this.findById(id);
    this.validateBookingStatusTransition(booking.status, updateDto.status);
    booking.status = updateDto.status;
    if (updateDto.notes) {
      booking.notes = updateDto.notes;
    }
    if (updateDto.status === BookingStatus.APPROVED && !booking.approvedBy) {
      booking.approvedBy = userId;
    }

    return this.bookingRepository.save(booking);
  }

  private validateBookingStatusTransition(
    from: BookingStatus,
    to: BookingStatus,
  ): void {
    const allowedTransitions: BookingStatus[] =
      ALLOWED_BOOKING_STATUS_TRANSITIONS[from];
    if (!allowedTransitions.includes(to)) {
      throw new BadRequestException(
        `Cannot transition from ${from} to ${to}. Allowed transitions: ${allowedTransitions.join(', ')}`,
      );
    }
  }

  /**
   * Mark booking as completed (ADMIN/SALES)
   */
  async completeBooking(
    id: string,
    actualReturnDateTime?: Date,
  ): Promise<Booking> {
    const booking = await this.findById(id);

    if (booking.status !== BookingStatus.ONGOING) {
      throw new BadRequestException(`Only ONGOING bookings can be completed`);
    }

    booking.status = BookingStatus.COMPLETED;
    if (actualReturnDateTime) {
      booking.actualReturnDateTime = actualReturnDateTime;
    }

    return this.bookingRepository.save(booking);
  }

  /**
   * Get booking statistics
   */
  async getStats(): Promise<{
    pending: number;
    approved: number;
    ongoing: number;
    completed: number;
    cancelled: number;
  }> {
    const stats = await this.bookingRepository
      .createQueryBuilder('booking')
      .select('booking.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('booking.status')
      .getRawMany();

    const result = {
      pending: 0,
      approved: 0,
      ongoing: 0,
      completed: 0,
      cancelled: 0,
    };

    stats.forEach((stat) => {
      result[stat.status.toLowerCase()] = parseInt(stat.count, 10);
    });

    return result;
  }

  /**
   * Get total revenue from completed bookings
   */
  async getTotalRevenue(): Promise<number> {
    const result = await this.bookingRepository
      .createQueryBuilder('booking')
      .select('SUM(booking.depositAmount)', 'total')
      .where('booking.status IN (:...statuses)', {
        statuses: [
          BookingStatus.COMPLETED,
          BookingStatus.APPROVED,
          BookingStatus.ONGOING,
        ],
      })
      .getRawOne();

    return result.total ? parseFloat(result.total) : 0;
  }
}
