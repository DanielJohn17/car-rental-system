import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../auth/entities/user.entity';
import { CustomerProfile } from '../users/entities/customer-profile.entity';
import { Location } from '../locations/entities/location.entity';
import { Vehicle } from '../vehicle/entities/vehicle.entity';
import { MaintenanceRecord } from '../vehicle/entities/maintenance-record.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { Payment } from '../payments/entities/payment.entity';
import { DamageReport } from '../dashboard/entities/damage-report.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres' as const,
        url:
          configService.get<string>('DB_CONNECTION_STRING') ??
          configService.get<string>('DATABASE_URL'),
        retryAttempts: 1,
        retryDelay: 0,
        entities: [
          User,
          CustomerProfile,
          Location,
          Vehicle,
          MaintenanceRecord,
          Booking,
          Payment,
          DamageReport,
        ],
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        extra: {
          connectionTimeoutMillis: 8000,
          statement_timeout: 8000,
        },
        // logging: configService.get<string>('NODE_ENV') === 'development',
      }),
    }),
  ],
})
export class DatabaseModule {}
