import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserPlatform } from './user-platform.entity';
import { UserPlatformService } from './user-platform.service';
import { UserPlatformController } from './user-platform.controller';

/**
 * Module for platform-user management functionality.
 * @module UserPlatformModule
 */
@Module({
  imports: [TypeOrmModule.forFeature([UserPlatform])],
  controllers: [UserPlatformController],
  providers: [UserPlatformService],
  exports: [TypeOrmModule],
})
export class UserPlatformModule {}
