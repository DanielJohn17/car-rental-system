import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as path from 'path';
import { DataSource, type DataSourceOptions } from 'typeorm';
import { User } from '../../modules/auth/entities/user.entity';
import { CustomerProfile } from '../../modules/users/entities/customer-profile.entity';
import { Location } from '../../modules/locations/entities/location.entity';
import { Vehicle } from '../../modules/vehicle/entities/vehicle.entity';
import { MaintenanceRecord } from '../../modules/vehicle/entities/maintenance-record.entity';
import { Booking } from '../../modules/bookings/entities/booking.entity';
import { Payment } from '../../modules/payments/entities/payment.entity';
import { DamageReport } from '../../modules/dashboard/entities/damage-report.entity';

const DEFAULT_DB_RETRY_ATTEMPTS = 5;
const DEFAULT_DB_RETRY_BASE_DELAY_MS = 250;
const DEFAULT_DB_RETRY_MAX_DELAY_MS = 5000;

function parsePositiveInteger(
  value: string | undefined,
  defaultValue: number,
): number {
  const parsedValue: number = Number.parseInt(value ?? '', 10);
  if (Number.isFinite(parsedValue) && parsedValue > 0) {
    return parsedValue;
  }
  return defaultValue;
}

function parseNonNegativeInteger(
  value: string | undefined,
  defaultValue: number,
): number {
  const parsedValue: number = Number.parseInt(value ?? '', 10);
  if (Number.isFinite(parsedValue) && parsedValue >= 0) {
    return parsedValue;
  }
  return defaultValue;
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise<void>((resolve: () => void) => {
    setTimeout(resolve, milliseconds);
  });
}

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const retryAttempts: number = parsePositiveInteger(
          configService.get<string>('DB_RETRY_ATTEMPTS'),
          DEFAULT_DB_RETRY_ATTEMPTS,
        );
        const retryBaseDelayMs: number = parseNonNegativeInteger(
          configService.get<string>('DB_RETRY_BASE_DELAY_MS'),
          DEFAULT_DB_RETRY_BASE_DELAY_MS,
        );
        const retryMaxDelayMs: number = parseNonNegativeInteger(
          configService.get<string>('DB_RETRY_MAX_DELAY_MS'),
          DEFAULT_DB_RETRY_MAX_DELAY_MS,
        );
        let retryIndex: number = 0;
        return {
          type: 'postgres' as const,
          url:
            configService.get<string>('DB_CONNECTION_STRING') ??
            configService.get<string>('DATABASE_URL'),
          retryAttempts,
          retryDelay: 0,
          dataSourceFactory: async (options: DataSourceOptions) => {
            const attemptNumber: number = retryIndex;
            retryIndex += 1;
            if (attemptNumber > 0) {
              const delayMs: number = Math.min(
                retryMaxDelayMs,
                retryBaseDelayMs * 2 ** (attemptNumber - 1),
              );
              await sleep(delayMs);
            }
            const dataSource: DataSource = new DataSource(options);
            await dataSource.initialize();
            return dataSource;
          },
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
        };
      },
    }),
  ],
})
export class DatabaseModule {}
