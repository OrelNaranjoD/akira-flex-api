import { Controller, Get } from '@nestjs/common';

/**
 * Controller responsible for handling status check requests.
 *
 * @class StatusController
 * @description Provides an endpoint to verify the API's status.
 */
@Controller('status')
export class StatusController {
  /**
   * Handles GET requests to the /status endpoint.
   * @returns An object indicating the API status.
   */
  @Get()
  status() {
    return { status: 'OK' };
  }
}
