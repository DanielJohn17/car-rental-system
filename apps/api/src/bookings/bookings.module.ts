import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { VehicleModule } from '../vehicle/vehicle.module';
import { LocationsModule } from '../locations/locations.module';
import { Booking } from './entities/booking.entity';
import { Vehicle } from '../vehicle/entities/vehicle.entity';
import { Location } from '../locations/entities/location.entity';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';

@Module({
  imports: [
    AuthModule,
    VehicleModule,
    LocationsModule,
    TypeOrmModule.forFeature([Booking, Vehicle, Location]),
  ],
  providers: [BookingsService],
  controllers: [BookingsController],
  exports: [BookingsService, TypeOrmModule],
})
export class BookingsModule {}
