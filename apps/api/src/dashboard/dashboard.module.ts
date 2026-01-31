import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsModule } from '../bookings/bookings.module';
import { PaymentsModule } from '../payments/payments.module';
import { VehicleModule } from '../vehicle/vehicle.module';
import { DamageReport } from './entities/damage-report.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [
    BookingsModule,
    PaymentsModule,
    VehicleModule,
    TypeOrmModule.forFeature([DamageReport]),
  ],
  providers: [DashboardService],
  controllers: [DashboardController],
  exports: [DashboardService],
})
export class DashboardModule {}
