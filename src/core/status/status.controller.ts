import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HealthCheck } from '@nestjs/terminus';

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
  status(): { status: string } {
    return { status: 'OK' };
  }

  /**
   * Health check endpoint.
   * @returns Health check result.
   */
  @Get('health')
  @HealthCheck()
  check() {
    return this.health.check([]);
  }
}
