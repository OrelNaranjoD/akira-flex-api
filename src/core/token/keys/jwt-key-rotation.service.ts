import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { JwtKeyManagerService } from './jwt-key-manager.service';

/**
 * Service for automatic JWT key rotation.
 * Handles scheduled key rotation based on configuration.
 */
@Injectable()
export class JwtKeyRotationService {
  private readonly logger = new Logger(JwtKeyRotationService.name);
  private readonly rotationEnabled: boolean;
  private readonly rotationIntervalHours: number;

  constructor(
    private readonly jwtKeyManager: JwtKeyManagerService,
    private readonly configService: ConfigService
  ) {
    this.rotationEnabled = this.configService.get('JWT_KEY_ROTATION_ENABLED', 'true') === 'true';
    this.rotationIntervalHours = this.configService.get('JWT_KEY_ROTATION_INTERVAL_HOURS', 24);
  }

  /**
   * Scheduled task to check and rotate keys if needed.
   * Runs every hour but only rotates if the interval has passed.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleScheduledKeyRotation(): Promise<void> {
    if (!this.rotationEnabled) {
      return;
    }

    try {
      const shouldRotate = await this.jwtKeyManager.shouldRotateKey(this.rotationIntervalHours);

      if (shouldRotate) {
        this.logger.log(`Rotating JWT key after ${this.rotationIntervalHours} hours`);
        await this.jwtKeyManager.rotateKey('system', 'Automatic rotation based on time interval');

        await this.jwtKeyManager.cleanupOldKeys();
      }
    } catch (error) {
      this.logger.error('Failed to perform scheduled key rotation', error);
    }
  }

  /**
   * Manually trigger key rotation.
   * @param deactivatedBy - User/system that triggered the rotation.
   * @param reason - Reason for rotation.
   * @returns The new active key.
   */
  async rotateKeyManually(deactivatedBy?: string, reason?: string) {
    this.logger.log(`Manual JWT key rotation triggered by: ${deactivatedBy || 'system'}`);

    const newKey = await this.jwtKeyManager.rotateKey(deactivatedBy, reason);

    await this.jwtKeyManager.cleanupOldKeys();

    return newKey;
  }

  /**
   * Get current rotation configuration.
   * @returns Configuration object.
   */
  getRotationConfig() {
    return {
      enabled: this.rotationEnabled,
      intervalHours: this.rotationIntervalHours,
      retentionCount: this.configService.get('JWT_KEY_RETENTION_COUNT', 5),
    };
  }
}
