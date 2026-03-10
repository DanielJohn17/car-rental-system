import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

type RequestWithId = Request & { id?: string };

type ErrorResponseBody = {
  statusCode: number;
  timestamp: string;
  path: string;
  requestId: string | null;
  message: string | string[];
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response: Response = ctx.getResponse<Response>();
    const request: RequestWithId = ctx.getRequest<RequestWithId>();

    const statusCode: number = this.getStatusCode(exception);
    const message: string | string[] = this.getMessage(exception);

    const body: ErrorResponseBody = {
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.originalUrl ?? request.url,
      requestId: request.id ?? null,
      message,
    };

    response.status(statusCode).json(body);
  }

  private getStatusCode(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private getMessage(exception: unknown): string | string[] {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'string') {
        return response;
      }
      if (response && typeof response === 'object' && 'message' in response) {
        const message: unknown = (response as Record<string, unknown>)['message'];
        if (typeof message === 'string' || Array.isArray(message)) {
          return message as string | string[];
        }
      }
      return exception.message;
    }
    if (exception instanceof Error) {
      return exception.message;
    }
    return 'Internal server error';
  }
}
