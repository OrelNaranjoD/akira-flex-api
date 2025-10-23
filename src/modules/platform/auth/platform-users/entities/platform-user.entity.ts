import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  JoinTable,
  ManyToMany,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { PlatformRole } from '../../platform-roles/entities/platform-role.entity';
import { PlatformUserEntity } from '@shared';
import { PlatformPermission } from '../../platform-permissions/entities/platform-permission.entity';
import { Tenant } from '../../../tenants/entities/tenant.entity';

/**
 * Enum for tenant request status.
 */
export enum TenantRequestStatus {
  NONE = 'none',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

/**
 * Represents a platform user.
 * @class PlatformUser
 */
@Entity('users', { schema: 'public' })
export class PlatformUser implements PlatformUserEntity {
  /**
   * Unique identifier for the user.
   * @type {string}
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * User email address.
   * @type {string}
   */
  @Column({ type: 'varchar', unique: true })
  email: string;

  /**
   * Hashed user password.
   * @type {string}
   */
  @Column({ type: 'varchar' })
  password: string;

  /**
   * User first name.
   * @type {string}
   */
  @Column({ type: 'varchar', name: 'first_name' })
  firstName: string;

  /**
   * User last name.
   * @type {string}
   */
  @Column({ type: 'varchar', name: 'last_name' })
  lastName: string;

  /**
   * User phone number.
   * @type {string}
   */
  @Column({ type: 'varchar', nullable: true })
  phone: string;

  /**
   * User roles.
   * @type {PlatformRole[]}
   */
  @ManyToMany(() => PlatformRole, { eager: true })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: any;

  /**
   * Tenants that this platform user can manage (for admin users).
   * @type {Tenant[]}
   */
  @ManyToMany(() => Tenant, { eager: false })
  @JoinTable({
    name: 'platform_user_tenants',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tenant_id', referencedColumnName: 'id' },
  })
  managedTenants: Tenant[];

  /**
   * Returns all permissions for the user derived from roles.
   * @returns {PlatformPermission[]} Array of unique permissions.
   */
  get permissions(): PlatformPermission[] {
    if (!this.roles) return [];
    const perms: PlatformPermission[] = (this.roles as any[]).flatMap(
      (role: any) => (role.permissions || []) as PlatformPermission[]
    );
    const unique = new Map<string, PlatformPermission>(
      perms.map((p: PlatformPermission) => [p.id, p] as [string, PlatformPermission])
    );
    return Array.from(unique.values());
  }

  /**
   * User activation status.
   * @type {boolean}
   */
  @Column({ type: 'boolean', default: true })
  active: boolean;

  /**
   * Date when the user was created.
   * @type {Date}
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * Date when the user was last updated.
   * @type {Date}
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  /**
   * Date of last successful login.
   * @type {Date}
   */
  @Column({ type: 'timestamp', name: 'last_login', nullable: true })
  lastLogin: Date;

  /**
   * Hashed refresh token for cookie-based refresh flows.
   * Stored as a hash for security. Nullable when no refresh token issued.
   */
  @Column({ type: 'varchar', name: 'refresh_token_hash', nullable: true })
  refreshTokenHash?: string;

  /**
   * Status of tenant creation request.
   * @type {TenantRequestStatus}
   */
  @Column({
    type: 'enum',
    enum: TenantRequestStatus,
    default: TenantRequestStatus.NONE,
    name: 'tenant_request_status',
  })
  tenantRequestStatus: TenantRequestStatus;

  /**
   * Requested company name for tenant creation.
   * @type {string}
   */
  @Column({ type: 'varchar', name: 'requested_company_name', nullable: true })
  requestedCompanyName?: string;

  /**
   * Requested subdomain for tenant creation.
   * @type {string}
   */
  @Column({ type: 'varchar', name: 'requested_subdomain', nullable: true })
  requestedSubdomain?: string;

  /**
   * Hashes password before inserting into database.
   * @private
   */
  @BeforeInsert()
  async hashPassword() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  /**
   * Compares provided password with stored hash.
   * @param {string} password - Password to compare.
   * @returns {Promise<boolean>} True if passwords match.
   */
  async comparePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  /**
   * Clears the stored refresh token hash (use on logout/revoke).
   */
  clearRefreshToken() {
    this.refreshTokenHash = undefined;
  }
}
