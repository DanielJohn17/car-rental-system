import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Keyv from 'keyv';
import KeyvRedis from '@keyv/redis';

const DEFAULT_CACHE_TTL_SECONDS = 60;

function parseBoolean(
  value: string | undefined,
  defaultValue: boolean,
): boolean {
  if (value === undefined) {
    return defaultValue;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
    return true;
  }
  if (normalized === 'false' || normalized === '0' || normalized === 'no') {
    return false;
  }
  return defaultValue;
}

@Module({
  imports: [
    ConfigModule,
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const isCacheEnabled: boolean = parseBoolean(
          configService.get<string>('CACHE_ENABLED'),
          true,
        );
        const ttl: number = Number(
          configService.get<string>('CACHE_DEFAULT_TTL_SECONDS') ??
            DEFAULT_CACHE_TTL_SECONDS,
        );
        if (!isCacheEnabled) {
          return { ttl };
        }
        const redisUrl: string | undefined =
          configService.get<string>('REDIS_URL');
        if (!redisUrl) {
          return { ttl };
        }
        const keyv: Keyv = new Keyv({
          store: new KeyvRedis(redisUrl),
        });
        return { ttl, stores: [keyv] };
      },
    }),
  ],
})
export class AppCacheModule {}
