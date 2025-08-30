import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InitialSeeder } from './seeds/initial.seeder';

/**
 * Module for database operations and seeding.
 * @module DatabaseModule
 */
@Module({
  imports: [TypeOrmModule.forFeature([])],
  providers: [InitialSeeder],
  exports: [InitialSeeder],
})
export class DatabaseModule {}
