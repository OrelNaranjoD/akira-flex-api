import { Module } from '@nestjs/common';
import { PlatformRoleController } from './platform-role.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformRole } from './entities/platform-role.entity';
import { PlatformRoleService } from './platform-role.service';

/**
 * Platform role module for managing platform roles and permissions.
 */
@Module({
  imports: [TypeOrmModule.forFeature([PlatformRole])],
  controllers: [PlatformRoleController],
  providers: [PlatformRoleService],
  exports: [TypeOrmModule, PlatformRoleService],
})
export class PlatformRoleModule {}
