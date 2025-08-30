import { Module } from '@nestjs/common';
import { StatusController } from './status.controller';

/**
 * Module exposing a simple /status endpoint used in e2e tests.
 */
@Module({
  controllers: [StatusController],
})
export class StatusModule {}
