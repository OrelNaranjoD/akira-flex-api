import { Controller, Get, Post, Put, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtKeyManagerService } from './jwt-key-manager.service';
import { JwtKeyRotationService } from './jwt-key-rotation.service';
import {
  JwtKeyStatsDto,
  RotateJwtKeyDto,
  JwtKeyRotationResponseDto,
  JwtKeyConfigDto,
  UpdateJwtKeyConfigDto,
} from './dtos/jwt-key-management.dto';
import { PlatformPermissionGuard } from '../../../modules/platform/auth/platform-permissions/guards/platform-permission.guard';

/**
 * Controller for administrative JWT key management operations.
 * Requires platform-level permissions for security.
 */
@ApiTags('JWT Key Management')
@ApiBearerAuth()
@Controller('admin/jwt-keys')
@UseGuards(PlatformPermissionGuard)
export class JwtKeyManagementController {
  constructor(
    private readonly jwtKeyManager: JwtKeyManagerService,
    private readonly jwtKeyRotation: JwtKeyRotationService
  ) {}

  /**
   * Get JWT key statistics and current status.
   * @returns JWT key statistics.
   */
  @Get('stats')
  @ApiOperation({
    summary: 'Get JWT key statistics',
    description: 'Retrieve statistics about current JWT keys including active key info and counts.',
  })
  @ApiResponse({
    status: 200,
    description: 'JWT key statistics retrieved successfully',
    type: JwtKeyStatsDto,
  })
  @UseGuards(PlatformPermissionGuard)
  async getKeyStats(): Promise<JwtKeyStatsDto> {
    return await this.jwtKeyManager.getKeyStats();
  }

  /**
   * Manually rotate the JWT key.
   * @param rotateDto - The rotation request data.
   * @returns The rotation response.
   */
  @Post('rotate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rotate JWT key manually',
    description: 'Manually trigger JWT key rotation for security purposes.',
  })
  @ApiResponse({
    status: 200,
    description: 'JWT key rotated successfully',
    type: JwtKeyRotationResponseDto,
  })
  @UseGuards(PlatformPermissionGuard)
  async rotateKey(@Body() rotateDto: RotateJwtKeyDto): Promise<JwtKeyRotationResponseDto> {
    const newKey = await this.jwtKeyRotation.rotateKeyManually(
      rotateDto.deactivatedBy,
      rotateDto.reason
    );

    return {
      newKeyId: newKey.id,
      rotatedAt: new Date(),
      deactivatedBy: rotateDto.deactivatedBy,
      reason: rotateDto.reason,
    };
  }

  /**
   * Get current JWT key rotation configuration.
   * @returns The current configuration.
   */
  @Get('config')
  @ApiOperation({
    summary: 'Get JWT key rotation configuration',
    description: 'Retrieve current configuration for automatic JWT key rotation.',
  })
  @ApiResponse({
    status: 200,
    description: 'Configuration retrieved successfully',
    type: JwtKeyConfigDto,
  })
  @UseGuards(PlatformPermissionGuard)
  getRotationConfig(): JwtKeyConfigDto {
    const config = this.jwtKeyRotation.getRotationConfig();
    return {
      enabled: config.enabled,
      intervalHours: config.intervalHours,
      retentionCount: config.retentionCount,
    };
  }

  /**
   * Update JWT key rotation configuration.
   * @param updateDto - The configuration update data.
   * @returns The updated configuration.
   */
  @Put('config')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update JWT key rotation configuration',
    description: 'Update configuration settings for automatic JWT key rotation.',
  })
  @ApiResponse({
    status: 200,
    description: 'Configuration updated successfully',
    type: JwtKeyConfigDto,
  })
  @UseGuards(PlatformPermissionGuard)
  updateRotationConfig(@Body() updateDto: UpdateJwtKeyConfigDto): JwtKeyConfigDto {
    const config = this.jwtKeyRotation.getRotationConfig();

    return {
      enabled: updateDto.enabled ?? config.enabled,
      intervalHours: updateDto.intervalHours ?? config.intervalHours,
      retentionCount: updateDto.retentionCount ?? config.retentionCount,
    };
  }
}
