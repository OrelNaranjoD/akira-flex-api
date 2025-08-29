import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

/**
 * Module for platform management.
 */
@Module({
  imports: [TypeOrmModule.forFeature([])],
})
export class PlatformModule {}
