import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { HttpLoggingInterceptor } from './http-logging.interceptor';
import { RequestIdMiddleware } from './request-id.middleware';

@Module({
  providers: [
    RequestIdMiddleware,
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpLoggingInterceptor,
    },
  ],
  exports: [RequestIdMiddleware],
})
export class LoggingModule {}
