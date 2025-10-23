import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { JwtKey } from './jwt-key.entity';

/**
 * JWT Key Manager Service.
 * Manages JWT signing keys with support for key rotation and multiple active keys.
 */
@Injectable()
export class JwtKeyManagerService implements OnModuleInit {
  private readonly logger = new Logger(JwtKeyManagerService.name);
  private cachedActiveKey: JwtKey | null = null;
  private cachedPreviousKeys: JwtKey[] = [];

  constructor(
    @InjectRepository(JwtKey)
    private readonly jwtKeyRepository: Repository<JwtKey>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService
  ) {}

  /**
   * Initialize JWT keys on module startup.
   */
  async onModuleInit(): Promise<void> {
    await this.initializeKeys();
  }

  /**
   * Initialize JWT keys on module startup.
   * Creates the first key if none exists.
   */
  private async initializeKeys(): Promise<void> {
    try {
      const existingKeys = await this.jwtKeyRepository.find({
        order: { createdAt: 'DESC' },
      });

      if (existingKeys.length === 0) {
        this.logger.log('No JWT keys found, creating initial key');
        await this.createInitialKey();
      } else {
        this.logger.log(`Found ${existingKeys.length} JWT keys`);
        this.updateCache(existingKeys);
      }
    } catch (error) {
      this.logger.error('Failed to initialize JWT keys', error);
      throw error;
    }
  }

  /**
   * Create the initial JWT key from environment variable or generate a new one.
   */
  private async createInitialKey(): Promise<void> {
    const envKey = this.configService.get<string>('JWT_PLATFORM_SECRET');
    const keyValue = envKey || this.generateSecureKey();

    const jwtKey = this.jwtKeyRepository.create({
      keyValue,
      isActive: true,
      keyId: 'initial-key',
    });

    await this.jwtKeyRepository.save(jwtKey);
    this.cachedActiveKey = jwtKey;
    this.logger.log('Initial JWT key created successfully');
  }

  /**
   * Generate a cryptographically secure random key.
   * @returns A 64-character hex string (512 bits).
   */
  private generateSecureKey(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  /**
   * Update the cached keys.
   * @param keys - Array of JWT keys ordered by creation date (newest first).
   */
  private updateCache(keys: JwtKey[]): void {
    this.cachedActiveKey = keys.find((key) => key.isActive) || null;
    this.cachedPreviousKeys = keys.filter((key) => !key.isActive).slice(0, 5);
  }

  /**
   * Get the currently active JWT key.
   * @returns The active JWT key.
   * @throws Error if no active key is found.
   */
  async getActiveKey(): Promise<JwtKey> {
    if (!this.cachedActiveKey) {
      const activeKey = await this.jwtKeyRepository.findOne({
        where: { isActive: true },
      });

      if (!activeKey) {
        throw new Error('No active JWT key found');
      }

      this.cachedActiveKey = activeKey;
    }

    return this.cachedActiveKey;
  }

  /**
   * Get all valid keys (active + recent inactive) for token verification.
   * @returns Array of valid JWT keys.
   */
  async getValidKeys(): Promise<JwtKey[]> {
    const keys = await this.jwtKeyRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
      take: 6,
    });

    const inactiveKeys = await this.jwtKeyRepository.find({
      where: { isActive: false },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    return [...keys, ...inactiveKeys];
  }

  /**
   * Verify a JWT token using any valid key.
   * @param token - The JWT token to verify.
   * @returns The decoded payload.
   * @throws Error if token cannot be verified with any key.
   */
  async verifyToken<T extends object = any>(token: string): Promise<T> {
    const validKeys = await this.getValidKeys();

    for (const key of validKeys) {
      try {
        const payload = this.jwtService.verify<T>(token, {
          secret: key.keyValue,
        });

        await this.recordKeyUsage(key.id);

        return payload;
      } catch {
        continue;
      }
    }

    throw new Error('Token verification failed with all available keys');
  }

  /**
   * Sign a JWT token with the active key.
   * @param payload - The payload to sign.
   * @param options - JWT signing options.
   * @param options.expiresIn - Token expiration time.
   * @returns The signed JWT token.
   */
  async signToken(payload: any, options?: { expiresIn?: string | number }): Promise<string> {
    const activeKey = await this.getActiveKey();

    const token = this.jwtService.sign(payload as object, {
      secret: activeKey.keyValue,
      ...options,
    });

    await this.recordKeyUsage(activeKey.id);

    return token;
  }

  /**
   * Rotate to a new active key.
   * Deactivates the current active key and creates a new one.
   * @param deactivatedBy - User/system that triggered the rotation.
   * @param reason - Reason for rotation.
   * @returns The new active key.
   */
  async rotateKey(deactivatedBy?: string, reason?: string): Promise<JwtKey> {
    const currentActiveKey = await this.getActiveKey();

    currentActiveKey.deactivate(deactivatedBy, reason);
    await this.jwtKeyRepository.save(currentActiveKey);

    const newKeyValue = this.generateSecureKey();
    const newKey = this.jwtKeyRepository.create({
      keyValue: newKeyValue,
      isActive: true,
      keyId: `key-${Date.now()}`,
    });

    const savedNewKey = await this.jwtKeyRepository.save(newKey);

    this.cachedActiveKey = savedNewKey;
    this.cachedPreviousKeys.unshift(currentActiveKey);

    if (this.cachedPreviousKeys.length > 5) {
      this.cachedPreviousKeys = this.cachedPreviousKeys.slice(0, 5);
    }

    this.logger.log(`JWT key rotated successfully. New key ID: ${savedNewKey.id}`);

    return savedNewKey;
  }

  /**
   * Check if key rotation is needed based on age.
   * @param maxAgeHours - Maximum age in hours before rotation.
   * @returns True if rotation is needed.
   */
  async shouldRotateKey(maxAgeHours: number = 24): Promise<boolean> {
    const activeKey = await this.getActiveKey();
    return activeKey.isExpired(maxAgeHours);
  }

  /**
   * Get key statistics for monitoring.
   * @returns Object with key statistics.
   */
  async getKeyStats(): Promise<{
    activeKey: { id: string; createdAt: Date; usageCount: number };
    totalKeys: number;
    inactiveKeys: number;
  }> {
    const activeKey = await this.getActiveKey();
    const allKeys = await this.jwtKeyRepository.find();
    const inactiveKeys = allKeys.filter((key) => !key.isActive);

    return {
      activeKey: {
        id: activeKey.id,
        createdAt: activeKey.createdAt,
        usageCount: activeKey.usageCount,
      },
      totalKeys: allKeys.length,
      inactiveKeys: inactiveKeys.length,
    };
  }

  /**
   * Record usage of a specific key.
   * @param keyId - The key ID to record usage for.
   */
  private async recordKeyUsage(keyId: string): Promise<void> {
    try {
      await this.jwtKeyRepository.increment({ id: keyId }, 'usageCount', 1);
      await this.jwtKeyRepository.update({ id: keyId }, { lastUsedAt: new Date() });

      if (this.cachedActiveKey?.id === keyId) {
        this.cachedActiveKey.usageCount++;
        this.cachedActiveKey.lastUsedAt = new Date();
      }
    } catch (error) {
      this.logger.warn(`Failed to record key usage for key ${keyId}`, error);
    }
  }

  /**
   * Clean up old inactive keys (keep only last N keys).
   * @param keepCount - Number of inactive keys to keep (default: 5).
   */
  async cleanupOldKeys(keepCount: number = 5): Promise<void> {
    const inactiveKeys = await this.jwtKeyRepository.find({
      where: { isActive: false },
      order: { createdAt: 'DESC' },
    });

    if (inactiveKeys.length > keepCount) {
      const keysToDelete = inactiveKeys.slice(keepCount);
      const idsToDelete = keysToDelete.map((key) => key.id);

      await this.jwtKeyRepository.delete(idsToDelete);

      this.logger.log(`Cleaned up ${keysToDelete.length} old JWT keys`);
    }
  }
}
