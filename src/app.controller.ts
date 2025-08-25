import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

/**
 * Controller for application endpoints.
 */
@Controller()
export class AppController {
  /**
   * Creates an instance of AppController.
   * @param appService The service used to provide application logic.
   */
  constructor(private readonly appService: AppService) {}

  /**
   * Returns a greeting string.
   * @returns {string} A greeting message.
   */
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
