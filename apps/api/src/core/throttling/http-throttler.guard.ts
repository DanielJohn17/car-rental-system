import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { createHash } from 'crypto';
import type { JwtPayload } from '../../modules/auth/types/jwt-payload.type';

type RequestWithUser = {
  user?: JwtPayload;
  headers?: unknown;
  ips?: unknown;
  ip?: unknown;
};

@Injectable()
export class HttpThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, unknown>): Promise<string> {
    const request: RequestWithUser = req as RequestWithUser;

    if (request.user?.sub) {
      return request.user.sub;
    }

    const authorization: string | undefined = this.readAuthorization(
      request.headers,
    );
    if (authorization) {
      return this.hashValue(authorization);
    }

    const ips: unknown = request.ips;
    if (Array.isArray(ips) && typeof ips[0] === 'string' && ips[0].length > 0) {
      return ips[0];
    }

    const ip: unknown = request.ip;
    if (typeof ip === 'string' && ip.length > 0) {
      return ip;
    }

    return 'unknown';
  }

  private readAuthorization(headers: unknown): string | undefined {
    if (!headers || typeof headers !== 'object') {
      return undefined;
    }

    const record: Record<string, unknown> = headers as Record<string, unknown>;
    const headerValue: unknown = record['authorization'];

    const token: string | undefined = this.readBearerToken(headerValue);
    if (!token) {
      return undefined;
    }

    return token;
  }

  private readBearerToken(value: unknown): string | undefined {
    if (typeof value === 'string') {
      return this.parseBearerToken(value);
    }
    if (Array.isArray(value) && typeof value[0] === 'string') {
      return this.parseBearerToken(value[0]);
    }
    return undefined;
  }

  private parseBearerToken(value: string): string | undefined {
    const trimmed: string = value.trim();
    if (!trimmed.toLowerCase().startsWith('bearer ')) {
      return undefined;
    }
    const token: string = trimmed.slice('bearer '.length).trim();
    if (!token) {
      return undefined;
    }
    return token;
  }

  private hashValue(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }
}
