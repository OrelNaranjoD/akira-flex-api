import { Column, Entity, PrimaryGeneratedColumn, ManyToMany } from 'typeorm';
import { TenantRole } from '../../roles/entities/tenant-role.entity';

/**
 * Entity representing a platform-level permission.
 * Used for RBAC and granular access control.
 * @property id Unique identifier for the permission.
 * @property code Unique permission code (enum or string).
 * @property description Optional human-readable description.
 */
@Entity({ name: 'permissions' })
export class PlatformPermission {
  /** Unique identifier for the permission. */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Unique permission code (used in logic and JWT). */
  @Column({ type: 'varchar', unique: true })
  code: string;

  /** Optional description for UI or documentation. */
  @Column({ type: 'varchar', nullable: true })
  description?: string;

  /** Roles that have this permission. */
  @ManyToMany(() => TenantRole, (role) => role.permissions)
  roles: TenantRole[];
}
