import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
  JoinTable,
  ManyToMany,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Status } from '../../../../../core/shared/definitions';
import { Role } from '../../roles/entities/role.entity';

/**
 * Represents a  user.
 * @class User
 */
@Entity('users', { schema: 'public' })
export class User {
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
   * @type {Role[]}
   */
  @ManyToMany(() => Role, { eager: true })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];

  /**
   * User activation status.
   * @type {Status}
   */
  @Column({ type: 'enum', enum: Status, default: Status.PENDING_VERIFICATION })
  status: Status;

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
   * User type.
   * @type {string}
   */
  @Column({ type: 'varchar', default: 'LANDING' })
  type: string;

  /**
   * Verification PIN for email verification.
   * @type {string}
   */
  @Column({ type: 'varchar', name: 'verification_pin', nullable: true })
  verificationPin?: string;

  /**
   * Expiration date for the verification PIN.
   * @type {Date}
   */
  @Column({ type: 'timestamp', name: 'verification_pin_expires_at', nullable: true })
  verificationPinExpiresAt?: Date;

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
   * Hashes password before updating in database.
   * Only hashes if the password has changed.
   * @private
   */
  @BeforeUpdate()
  async hashPasswordUpdate() {
    if (this.password && !this.password.startsWith('$2b$')) {
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
