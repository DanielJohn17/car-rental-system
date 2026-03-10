import {
  Injectable,
  Logger,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Request, Response } from 'express';
import type { JwtPayload } from '../../modules/auth/types/jwt-payload.type';

type RequestWithUserAndId = Request & {
  user?: JwtPayload;
  id?: string;
};

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  private readonly logger: Logger = new Logger(HttpLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const req: RequestWithUserAndId = httpContext.getRequest<RequestWithUserAndId>();
    const res: Response = httpContext.getResponse<Response>();
    const startedAtMs: number = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          this.logRequest(req, res, startedAtMs);
        },
        error: () => {
          this.logRequest(req, res, startedAtMs);
        },
      }),
    );
  }

  private logRequest(req: RequestWithUserAndId, res: Response, startedAtMs: number): void {
    const durationMs: number = Date.now() - startedAtMs;
    const statusCode: number = res.statusCode;
    const requestId: string | undefined = req.id;

    const logPayload: Record<string, unknown> = {
      requestId,
      method: req.method,
      path: req.originalUrl ?? req.url,
      statusCode,
      durationMs,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      userId: req.user?.sub,
      userRole: req.user?.role,
      apiVersion: req.headers['accept-version'],
    };

    const message: string = JSON.stringify(logPayload);

    if (statusCode >= 500) {
      this.logger.error(message);
      return;
    }

    if (statusCode >= 400) {
      this.logger.warn(message);
      return;
    }

    this.logger.log(message);
  }
}
