import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpThrottlerGuard } from './http-throttler.guard';

const DEFAULT_TTL_MS = 60_000;
const DEFAULT_LIMIT = 240;

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const ttl: number = readNumber(
          configService.get<string>('THROTTLE_AUTH_TTL'),
          DEFAULT_TTL_MS,
        );
        const limit: number = readNumber(
          configService.get<string>('THROTTLE_AUTH_LIMIT'),
          DEFAULT_LIMIT,
        );
        return {
          throttlers: [
            {
              ttl,
              limit,
            },
          ],
        };
      },
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: HttpThrottlerGuard,
    },
  ],
})
export class ThrottlingModule {}

function readNumber(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }
  const parsed: number = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}
