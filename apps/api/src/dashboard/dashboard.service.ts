import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { Payment, PaymentStatus } from '../payments/entities/payment.entity';
import { Vehicle, VehicleStatus } from '../vehicle/entities/vehicle.entity';
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
  ) {}

  async getOverview(): Promise<DashboardOverviewDto> {
    // Count pending bookings
    const pendingBookingsCount = await this.bookingRepository.count({
      where: { status: BookingStatus.PENDING },
    });

    // Count active rentals (ONGOING)
    const activeRentalsCount = await this.bookingRepository.count({
      where: { status: BookingStatus.ONGOING },
    });

    // Count pending approvals
    const pendingApprovalsCount = pendingBookingsCount;

    // Calculate total revenue from paid deposits
    const paidPayments = await this.paymentRepository.find({
      where: { status: PaymentStatus.PAID },
    });

    const totalRevenueFromDeposits = paidPayments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    );

    const totalDepositsPaid = paidPayments.length;

    // Count vehicles in maintenance
    const vehiclesInMaintenanceCount = await this.vehicleRepository.count({
      where: { status: VehicleStatus.MAINTENANCE },
    });

    // Count available vehicles
    const availableVehiclesCount = await this.vehicleRepository.count({
      where: { status: VehicleStatus.AVAILABLE },
    });

    return {
      pendingBookingsCount,
      activeRentalsCount,
      totalRevenueFromDeposits,
      totalDepositsPaid,
      pendingApprovalsCount,
      vehiclesInMaintenanceCount,
      availableVehiclesCount,
    };
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
}
