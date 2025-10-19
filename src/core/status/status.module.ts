import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { StatusController } from './status.controller';

/**
 * Module exposing a simple /status endpoint used in e2e tests.
 */
@Module({
  imports: [TerminusModule],
  controllers: [StatusController],
})
export class StatusModule {}
