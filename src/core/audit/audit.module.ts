import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { AuditInterceptor } from './interceptors/audit.interceptor';
import { DebugRequestInterceptor } from './interceptors/debug-request.interceptor';
import { AuditLog } from './audit-log.entity';
import { DebugResponseInterceptor } from './interceptors/debug-response.interceptor';

/**
 * Module for audit functionality.
 * @module AuditModule
 */
@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  controllers: [AuditController],
  providers: [
    AuditService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useFactory: () => {
        const isDev = process.env.NODE_ENV === 'development';
        const debugEnabled = process.env.ENABLE_DEBUG_REQUEST_INTERCEPTOR === 'true';
        return isDev && debugEnabled
          ? new DebugRequestInterceptor()
          : { intercept: (ctx, next) => next.handle() };
      },
    },
    {
      provide: APP_INTERCEPTOR,
      useFactory: () => {
        const isDev = process.env.NODE_ENV === 'development';
        const debugEnabled = process.env.ENABLE_DEBUG_RESPONSE_INTERCEPTOR === 'true';
        return isDev && debugEnabled
          ? new DebugResponseInterceptor()
          : { intercept: (ctx, next) => next.handle() };
      },
    },
  ],
  exports: [AuditService],
})
export class AuditModule {}
