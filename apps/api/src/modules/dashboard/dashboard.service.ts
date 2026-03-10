import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { Payment, PaymentStatus } from '../payments/entities/payment.entity';
import { Vehicle, VehicleStatus } from '../vehicle/entities/vehicle.entity';
import { CursorCodec } from '../../core/pagination/cursor-codec';
import type { CursorPaginatedResponse } from '../../core/pagination/cursor-paginated-response.type';
import {
  DashboardOverviewDto,
  PendingApprovalDto,
  FleetStatusSummaryDto,
  VehicleFleetStatusDto,
  RecentBookingDto,
} from './dtos';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  private readonly overviewCacheTtlSeconds: number = 30;

  async getOverview(): Promise<DashboardOverviewDto> {
    const cached =
      await this.cacheManager.get<DashboardOverviewDto>('dashboard:overview');
    if (cached) {
      return cached;
    }
    const [
      pendingBookingsCount,
      activeRentalsCount,
      revenueRow,
      vehiclesInMaintenanceCount,
      availableVehiclesCount,
    ] = await Promise.all([
      this.bookingRepository.count({
        where: { status: BookingStatus.PENDING },
      }),
      this.bookingRepository.count({
        where: { status: BookingStatus.ONGOING },
      }),
      this.paymentRepository
        .createQueryBuilder('payment')
        .select('COALESCE(SUM(payment.amount), 0)', 'totalRevenueFromDeposits')
        .addSelect('COUNT(*)', 'totalDepositsPaid')
        .where('payment.status = :status', { status: PaymentStatus.PAID })
        .getRawOne<{
          totalRevenueFromDeposits: string;
          totalDepositsPaid: string;
        }>(),
      this.vehicleRepository.count({
        where: { status: VehicleStatus.MAINTENANCE },
      }),
      this.vehicleRepository.count({
        where: { status: VehicleStatus.AVAILABLE },
      }),
    ]);

    const pendingApprovalsCount: number = pendingBookingsCount;
    const totalRevenueFromDeposits: number =
      revenueRow?.totalRevenueFromDeposits
        ? Number(revenueRow.totalRevenueFromDeposits)
        : 0;
    const totalDepositsPaid: number = revenueRow?.totalDepositsPaid
      ? Number(revenueRow.totalDepositsPaid)
      : 0;

    const response: DashboardOverviewDto = {
      pendingBookingsCount,
      activeRentalsCount,
      totalRevenueFromDeposits,
      totalDepositsPaid,
      pendingApprovalsCount,
      vehiclesInMaintenanceCount,
      availableVehiclesCount,
    };

    await this.cacheManager.set(
      'dashboard:overview',
      response,
      this.overviewCacheTtlSeconds,
    );

    return response;
  }

  async getPendingApprovals(limit: number = 10): Promise<PendingApprovalDto[]> {
    // Validate and clamp limit
    const validLimit = Math.min(Math.max(1, limit), 100);

    const pendingBookings = await this.bookingRepository.find({
      where: { status: BookingStatus.PENDING },
      relations: ['vehicle', 'pickupLocation', 'payments'],
      order: { createdAt: 'DESC' },
      take: validLimit,
    });

    return pendingBookings.map((booking) => {
      // Handle missing vehicle (edge case)
      const vehicleDisplay = booking.vehicle
        ? `${booking.vehicle.make} ${booking.vehicle.model} (${booking.vehicle.year})`
        : 'Unknown Vehicle';

      const depositPayment = booking.payments?.find(
        (p) => p.status === PaymentStatus.PAID,
      );

      return {
        bookingId: booking.id,
        guestName: booking.guestName || 'N/A',
        guestPhone: booking.guestPhone,
        guestEmail: booking.guestEmail,
        vehicleId: booking.vehicleId,
        vehicleDisplay,
        startDateTime: booking.startDateTime,
        endDateTime: booking.endDateTime,
        totalPrice: Number(booking.totalPrice),
        depositAmount: Number(booking.depositAmount),
        depositPaid: !!depositPayment,
        createdAt: booking.createdAt,
        pickupLocation: booking.pickupLocation?.name || 'N/A',
      };
    });
  }

  async getFleetStatus(): Promise<FleetStatusSummaryDto> {
    const vehicles = await this.vehicleRepository.find({
      relations: ['location'],
    });

    const statusCounts = {
      [VehicleStatus.AVAILABLE]: 0,
      [VehicleStatus.RENTED]: 0,
      [VehicleStatus.MAINTENANCE]: 0,
      [VehicleStatus.DAMAGED]: 0,
      [VehicleStatus.RESERVED]: 0,
    };

    const vehicleDtos: VehicleFleetStatusDto[] = vehicles
      .map((vehicle) => {
        // Handle invalid/unknown status
        if (vehicle.status && statusCounts.hasOwnProperty(vehicle.status)) {
          statusCounts[vehicle.status]++;
        }

        return {
          vehicleId: vehicle.id,
          make: vehicle.make || 'Unknown',
          model: vehicle.model || 'Unknown',
          year: vehicle.year || 0,
          licensePlate: vehicle.licensePlate || 'N/A',
          status: vehicle.status || VehicleStatus.AVAILABLE,
          location: vehicle.location?.name || 'Unassigned',
          dailyRate: Number(vehicle.dailyRate) || 0,
        };
      })
      // Sort by status for better organization
      .sort((a, b) => {
        const statusOrder = {
          [VehicleStatus.AVAILABLE]: 0,
          [VehicleStatus.RENTED]: 1,
          [VehicleStatus.RESERVED]: 2,
          [VehicleStatus.MAINTENANCE]: 3,
          [VehicleStatus.DAMAGED]: 4,
        };
        return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
      });

    return {
      totalVehicles: vehicles.length,
      available: statusCounts[VehicleStatus.AVAILABLE],
      rented: statusCounts[VehicleStatus.RENTED],
      maintenance: statusCounts[VehicleStatus.MAINTENANCE],
      damaged: statusCounts[VehicleStatus.DAMAGED],
      reserved: statusCounts[VehicleStatus.RESERVED],
      vehicles: vehicleDtos,
    };
  }

  async getRecentBookings(limit: number = 10): Promise<RecentBookingDto[]> {
    // Validate and clamp limit
    const validLimit = Math.min(Math.max(1, limit), 100);

    const bookings = await this.bookingRepository.find({
      relations: ['vehicle'],
      order: { createdAt: 'DESC' },
      take: validLimit,
    });

    return bookings.map((booking) => {
      // Handle missing vehicle (edge case)
      const vehicleDisplay = booking.vehicle
        ? `${booking.vehicle.make} ${booking.vehicle.model}`
        : 'Unknown Vehicle';

      return {
        bookingId: booking.id,
        guestName: booking.guestName || 'N/A',
        guestPhone: booking.guestPhone,
        vehicleDisplay,
        startDateTime: booking.startDateTime,
        endDateTime: booking.endDateTime,
        status: booking.status || BookingStatus.PENDING,
        totalPrice: Number(booking.totalPrice) || 0,
        createdAt: booking.createdAt,
      };
    });
  }

  async getRecentBookingsCursor(params: {
    limit?: number;
    cursor?: string;
  }): Promise<CursorPaginatedResponse<RecentBookingDto>> {
    const rawLimit: number = params.limit ?? 10;
    const limit: number = Math.min(Math.max(1, rawLimit), 100);

    const cursorPayload = params.cursor
      ? CursorCodec.decode<{ createdAt: string; id: string }>(
          params.cursor,
          (value: unknown): value is { createdAt: string; id: string } => {
            if (!value || typeof value !== 'object') {
              return false;
            }
            const record = value as Record<string, unknown>;
            return (
              typeof record.createdAt === 'string' &&
              typeof record.id === 'string'
            );
          },
        )
      : null;

    const query = this.bookingRepository.createQueryBuilder('booking');
    query.leftJoinAndSelect('booking.vehicle', 'vehicle');
    query.orderBy('booking.createdAt', 'DESC');
    query.addOrderBy('booking.id', 'DESC');

    if (cursorPayload) {
      query.andWhere(
        '(booking.createdAt < :createdAt OR (booking.createdAt = :createdAt AND booking.id < :id))',
        {
          createdAt: new Date(cursorPayload.createdAt),
          id: cursorPayload.id,
        },
      );
    }

    const results = await query.take(limit + 1).getMany();
    const hasMore: boolean = results.length > limit;
    const pageItems: Booking[] = hasMore ? results.slice(0, limit) : results;
    const data: RecentBookingDto[] = pageItems.map((booking) => {
      const vehicleDisplay = booking.vehicle
        ? `${booking.vehicle.make} ${booking.vehicle.model}`
        : 'Unknown Vehicle';
      return {
        bookingId: booking.id,
        guestName: booking.guestName || 'N/A',
        guestPhone: booking.guestPhone,
        vehicleDisplay,
        startDateTime: booking.startDateTime,
        endDateTime: booking.endDateTime,
        status: booking.status || BookingStatus.PENDING,
        totalPrice: Number(booking.totalPrice) || 0,
        createdAt: booking.createdAt,
      };
    });

    const lastItem: Booking | undefined = pageItems[pageItems.length - 1];
    const nextCursor: string | null =
      hasMore && lastItem
        ? CursorCodec.encode({
            createdAt: lastItem.createdAt.toISOString(),
            id: lastItem.id,
          })
        : null;

    return { data, limit, nextCursor };
  }
}
