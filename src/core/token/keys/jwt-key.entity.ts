import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * JWT Key entity for managing JWT signing keys with rotation support.
 * Stores multiple keys to support gradual key rotation and backward compatibility.
 */
@Entity('jwt_keys')
@Index(['isActive'])
@Index(['createdAt'])
export class JwtKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', unique: true })
  keyValue: string;

  @Column({ type: 'varchar', length: 50, default: 'HS256' })
  algorithm: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  deactivatedAt?: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  deactivatedBy?: string;

  @Column({ type: 'text', nullable: true })
  deactivationReason?: string;

  @Column({ type: 'int', default: 0 })
  usageCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt?: Date;

  @Column({ type: 'varchar', length: 50, nullable: true })
  keyId?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Mark this key as inactive.
   * @param deactivatedBy - User or system that deactivated the key.
   * @param reason - Reason for deactivation.
   */
  deactivate(deactivatedBy?: string, reason?: string): void {
    this.isActive = false;
    this.deactivatedAt = new Date();
    this.deactivatedBy = deactivatedBy;
    this.deactivationReason = reason;
  }

  /**
   * Record usage of this key.
   */
  recordUsage(): void {
    this.usageCount++;
    this.lastUsedAt = new Date();
  }

  /**
   * Check if the key is expired based on creation time and max age.
   * @param maxAgeHours - Maximum age in hours.
   * @returns True if expired.
   */
  isExpired(maxAgeHours: number): boolean {
    const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
    return Date.now() - this.createdAt.getTime() > maxAgeMs;
  }
}
