import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { VehicleModule } from '../vehicle/vehicle.module';
import { LocationsModule } from '../locations/locations.module';
import { Booking } from './entities/booking.entity';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';

@Module({
  imports: [
    AuthModule,
    VehicleModule,
    LocationsModule,
    TypeOrmModule.forFeature([Booking]),
  ],
  providers: [BookingsService],
  controllers: [BookingsController],
  exports: [BookingsService, TypeOrmModule],
})
export class BookingsModule {}
