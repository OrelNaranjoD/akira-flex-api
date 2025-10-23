import { PlatformUser } from '../../modules/platform/auth/platform-users/entities/platform-user.entity';
import { User } from '../../modules/platform/auth/users/entities/user.entity';
import { Role } from '../../modules/platform/auth/roles/entities/role.entity';
import { Permission } from '../../modules/platform/auth/permissions/entities/permission.entity';
import { Tenant } from '../../modules/platform/tenants/entities/tenant.entity';
import { AuditLog } from '../../core/audit/audit-log.entity';
import { TenantUser } from '../../modules/tenant/auth/users/tenant-user.entity';
import { TenantRole } from '../../modules/tenant/auth/roles/entities/tenant-role.entity';

/**
 * Entities for the platform (public schema).
 */
export const platformEntities = [PlatformUser, User, Role, Permission, Tenant, AuditLog];

/**
 * Entities for tenants (tenant-specific schemas).
 */
export const tenantEntities = [TenantUser, TenantRole];
