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

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
    @InjectRepository(Location)
    private locationRepository: Repository<Location>,
  ) {}

  /**
   * Create booking (PUBLIC - anonymous)
   * Validates: vehicle exists, location exists, dates valid, availability
   */
  async create(createBookingDto: CreateBookingDto): Promise<Booking> {
    // Validate dates
    const startDate = new Date(createBookingDto.startDateTime);
    const endDate = new Date(createBookingDto.endDateTime);

    if (startDate >= endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    if (startDate < new Date()) {
      throw new BadRequestException('Start date cannot be in the past');
    }

    // Check vehicle exists
    const vehicle = await this.vehicleRepository.findOne({
      where: { id: createBookingDto.vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    // Check vehicle is available for booking
    if (vehicle.status !== VehicleStatus.AVAILABLE) {
      throw new BadRequestException(
        `Vehicle is currently ${vehicle.status} and cannot be booked`,
      );
    }

    // Check pickup location exists
    const pickupLocation = await this.locationRepository.findOne({
      where: { id: createBookingDto.pickupLocationId },
    });

    if (!pickupLocation) {
      throw new NotFoundException('Pickup location not found');
    }

    // Check return location exists
    const returnLocation = await this.locationRepository.findOne({
      where: { id: createBookingDto.returnLocationId },
    });

    if (!returnLocation) {
      throw new NotFoundException('Return location not found');
    }

    // Check vehicle availability (no overlapping bookings)
    const overlappingBooking = await this.bookingRepository.findOne({
      where: {
        vehicleId: createBookingDto.vehicleId,
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

    // Validate pricing
    if (createBookingDto.depositAmount > createBookingDto.totalPrice) {
      throw new BadRequestException('Deposit amount cannot exceed total price');
    }

    // Create booking
    const booking = this.bookingRepository.create({
      ...createBookingDto,
      startDateTime: startDate,
      endDateTime: endDate,
      status: BookingStatus.PENDING,
    });

    return this.bookingRepository.save(booking);
  }

  /**
   * Get all bookings with filtering (ADMIN/SALES)
   */
  async findAll(
    status?: BookingStatus,
    limit: number = 20,
    offset: number = 0,
  ): Promise<{ data: Booking[]; total: number }> {
    const query = this.bookingRepository.createQueryBuilder('booking');

    if (status) {
      query.where('booking.status = :status', { status });
    }

    query.leftJoinAndSelect('booking.vehicle', 'vehicle');
    query.leftJoinAndSelect('booking.pickupLocation', 'pickupLocation');
    query.leftJoinAndSelect('booking.approver', 'approver');
    query.orderBy('booking.createdAt', 'DESC');
    query.take(limit);
    query.skip(offset);

    const [data, total] = await query.getManyAndCount();
    return { data, total };
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

    // Validate status transition
    const allowedTransitions: Record<BookingStatus, BookingStatus[]> = {
      [BookingStatus.PENDING]: [
        BookingStatus.APPROVED,
        BookingStatus.CANCELLED,
      ],
      [BookingStatus.APPROVED]: [
        BookingStatus.ONGOING,
        BookingStatus.CANCELLED,
      ],
      [BookingStatus.ONGOING]: [BookingStatus.COMPLETED, BookingStatus.OVERDUE],
      [BookingStatus.COMPLETED]: [],
      [BookingStatus.CANCELLED]: [],
      [BookingStatus.OVERDUE]: [BookingStatus.COMPLETED],
    };

    if (!allowedTransitions[booking.status].includes(updateDto.status)) {
      throw new BadRequestException(
        `Cannot transition from ${booking.status} to ${updateDto.status}. Allowed transitions: ${allowedTransitions[booking.status].join(', ')}`,
      );
    }

    booking.status = updateDto.status;
    if (updateDto.notes) {
      booking.notes = updateDto.notes;
    }
    if (updateDto.status === BookingStatus.APPROVED && !booking.approvedBy) {
      booking.approvedBy = userId;
    }

    return this.bookingRepository.save(booking);
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
