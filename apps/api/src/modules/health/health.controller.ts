import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { Throttle } from '@nestjs/throttler';

const HEALTH_TTL_MS = 60_000;
const HEALTH_LIMIT = 600;
const HEALTH_DB_TIMEOUT_MS = 5_000;

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @Throttle({ default: { ttl: HEALTH_TTL_MS, limit: HEALTH_LIMIT } })
  check() {
    return this.health.check([
      () => this.db.pingCheck('database', { timeout: HEALTH_DB_TIMEOUT_MS }),
    ]);
  }
}
