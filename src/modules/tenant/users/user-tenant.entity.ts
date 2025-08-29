import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from 'typeorm';
import * as bcrypt from 'bcrypt';

/**
 * Represents a tenant user within a specific company.
 * @class UserTenant
 */
@Entity('user_tenants')
export class UserTenant {
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
   * User roles within the tenant.
   * @type {string[]}
   */
  @Column('simple-array', { default: 'user' })
  roles: string[];

  /**
   * User activation status.
   * @type {boolean}
   */
  @Column({ type: 'boolean', default: true })
  active: boolean;

  /**
   * ID of the tenant this user belongs to.
   * @type {string}
   */
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

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
}
