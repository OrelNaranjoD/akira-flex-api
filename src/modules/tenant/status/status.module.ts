import { Module } from '@nestjs/common';
import { StatusController } from './status.controller';

/**
 * Status module for API status checks.
 */
@Module({
  controllers: [StatusController],
  providers: [],
})
export class StatusModule {}
