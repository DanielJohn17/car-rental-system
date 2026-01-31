import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationsModule } from '../locations/locations.module';
import { Vehicle } from './entities/vehicle.entity';
import { MaintenanceRecord } from './entities/maintenance-record.entity';
import { VehicleService } from './vehicle.service';
import { VehicleController } from './vehicle.controller';

@Module({
  imports: [
    LocationsModule,
    TypeOrmModule.forFeature([Vehicle, MaintenanceRecord]),
  ],
  exports: [TypeOrmModule],
  providers: [VehicleService],
  controllers: [VehicleController],
})
export class VehicleModule {}
