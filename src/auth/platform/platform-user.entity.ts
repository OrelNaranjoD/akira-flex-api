import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import type { PlatformUser, AdminRole } from '@definitions';

/**
 * Represents a user with administrative access to the platform.
 * This entity is isolated from tenant-specific users and lives in the platform schema.
 */
@Entity({ name: 'users', schema: 'platform' })
@Unique(['email'])
export class PlatformUserEntity implements Readonly<PlatformUser> {
  /**
   * Unique identifier for the platform user.
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Full name of the user.
   */
  @Column({ type: 'varchar', length: 120 })
  fullName: string;

  /**
   * Email address used for login and communication.
   * Must be unique across all platform users.
   */
  @Column({ type: 'varchar', length: 160 })
  email: string;

  /**
   * Hashed password for authentication.
   */
  @Column({ type: 'varchar', length: 255 })
  passwordHash: string;

  /**
   * Role assigned to the user, defining access level within the platform.
   * Example values: 'superadmin', 'support', 'auditor'.
   */
  @Column({ type: 'varchar', length: 50 })
  role: AdminRole;

  /**
   * Indicates whether the user account is active.
   */
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  /**
   * Timestamp when the user was created.
   */
  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  /**
   * Timestamp when the user was last updated.
   */
  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
