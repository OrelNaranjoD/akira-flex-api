import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { PlatformPermission } from '../../platform-permissions/entities/platform-permission.entity';

/**
 * Entity representing a platform-level role.
 * Used for RBAC at the platform level.
 * @property id Unique identifier for the role.
 * @property name Unique name of the role.
 * @property permissions Array of permission strings assigned to the role.
 */
@Entity({ name: 'roles', schema: 'public' })
export class PlatformRole {
  /**
   * Unique identifier for the role.
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Unique name of the role.
   */
  @Column({ unique: true })
  name: string;

  /**
   * Active status of the role.
   */
  @Column({ default: true })
  active: boolean;

  /**
   * Creation timestamp of the role.
   */
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  /**
   * Last update timestamp of the role.
   */
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  /**
   * Array of permissions assigned to the role.
   */
  @ManyToMany(() => PlatformPermission, { eager: true })
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissions: PlatformPermission[];
}
