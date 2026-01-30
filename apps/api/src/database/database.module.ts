import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  User,
  CustomerProfile,
  Location,
  Vehicle,
  Booking,
  Payment,
  DamageReport,
  MaintenanceRecord,
} from '../entities';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres' as const,
        url: configService.get<string>('DB_CONNECTION_STRING'),
        ssl: configService.get<string>('DB_PGSSLMODE') === 'require',
        entities: [
          User,
          CustomerProfile,
          Location,
          Vehicle,
          Booking,
          Payment,
          DamageReport,
          MaintenanceRecord,
        ],
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
    }),
  ],
})
export class DatabaseModule {}
