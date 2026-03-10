import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as path from 'path';
import { User } from '../../modules/auth/entities/user.entity';
import { CustomerProfile } from '../../modules/users/entities/customer-profile.entity';
import { Location } from '../../modules/locations/entities/location.entity';
import { Vehicle } from '../../modules/vehicle/entities/vehicle.entity';
import { MaintenanceRecord } from '../../modules/vehicle/entities/maintenance-record.entity';
import { Booking } from '../../modules/bookings/entities/booking.entity';
import { Payment } from '../../modules/payments/entities/payment.entity';
import { DamageReport } from '../../modules/dashboard/entities/damage-report.entity';

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
        migrations: [path.join(__dirname, 'migrations/*{.ts,.js}')],
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        extra: {
          connectionTimeoutMillis: 8000,
          statement_timeout: 8000,
        },
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
    }),
  ],
})
export class DatabaseModule {}
