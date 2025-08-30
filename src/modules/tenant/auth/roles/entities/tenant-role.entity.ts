import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Entity representing a tenant-level role.
 * Used for RBAC at the tenant level.
 * @property id Unique identifier for the role.
 * @property name Unique name of the role.
 * @property permissions Array of permission strings assigned to the role.
 */
@Entity('tenant_roles')
export class TenantRole {
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
   * Array of permission strings assigned to the role.
   */
  @Column('simple-array')
  permissions: string[];
}
