import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HealthCheck } from '@nestjs/terminus';
import { Public } from '../decorators/public.decorator';

/**
 * Simple status controller used by e2e tests.
 */
@Controller('status')
export class StatusController {
  constructor(private health: HealthCheckService) {}

  /** Returns the status of the service.
   * @returns {{status: string}} Status object.
   */
  @Get()
  @Public()
  status(): { status: string } {
    return { status: 'OK' };
  }

  /**
   * Health check endpoint.
   * @returns Health check result.
   */
  @Get('health')
  @HealthCheck()
  @Public()
  check() {
    return this.health.check([]);
  }
}
