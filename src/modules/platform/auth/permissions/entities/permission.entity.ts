import { Column, Entity, PrimaryGeneratedColumn, ManyToMany } from 'typeorm';
import { Role } from '../../roles/entities/role.entity';
import { PermissionEntity } from '@shared';

/**
 * Entity representing a permission.
 * Used for RBAC and granular access control.
 * @property id Unique identifier for the permission.
 * @property code Unique permission code (enum or string).
 * @property description Optional human-readable description.
 */
@Entity({ name: 'permissions', schema: 'public' })
export class Permission implements PermissionEntity {
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
  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];

  /** Active status of the permission. */
  @Column({ default: true })
  active: boolean;
}
