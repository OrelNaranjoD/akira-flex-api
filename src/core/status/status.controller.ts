import { Controller, Get } from '@nestjs/common';

/**
 * Simple status controller used by e2e tests.
 */
@Controller('status')
export class StatusController {
  /** Returns the status of the service.
   * @returns {{status: string}} Status object.
   */
  @Get()
  status(): { status: string } {
    return { status: 'OK' };
  }
}
