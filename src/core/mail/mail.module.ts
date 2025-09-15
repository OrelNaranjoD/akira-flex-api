import { Module } from '@nestjs/common';
import { MailService } from './mail.service';

/**
 * Module for mail functionality.
 * @module MailModule
 */
@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
