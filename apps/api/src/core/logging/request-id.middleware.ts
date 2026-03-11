import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';

type RequestWithId = Request & { id?: string };

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: RequestWithId, res: Response, next: NextFunction): void {
    const existingRequestId: string | undefined = this.readHeader(
      req,
      'x-request-id',
    );
    const requestId: string = existingRequestId ?? randomUUID();
    req.id = requestId;
    res.setHeader('x-request-id', requestId);
    next();
  }

  private readHeader(req: Request, headerName: string): string | undefined {
    const value: unknown = req.headers[headerName];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
    if (
      Array.isArray(value) &&
      typeof value[0] === 'string' &&
      value[0].trim().length > 0
    ) {
      return value[0];
    }
    return undefined;
  }
}
