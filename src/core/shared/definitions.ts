export interface CreatePlatformUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roles: string[];
}

export interface RegisterResponseDto {
  id: string;
  email: string;
  status: string;
  token: string;
}

export interface TenantUserResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roles: string[];
  active: boolean;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

export interface CreateTenantUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roles: string[];
  tenantId: string;
}

export interface CreatePlatformPermissionDto {
  code: string;
  description?: string;
}

export interface CreatePermissionDto {
  code: string;
  description?: string;
}

export interface PlatformUserEntity {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roles: string[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin: Date;
}

export interface RoleEntity {
  id: string;
  name: string;
  permissions: PermissionEntity[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PermissionEntity {
  id: string;
  code: string;
  description?: string;
  active: boolean;
  roles?: RoleEntity[];
}

export interface UserEntity {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roles: Role[];
  status: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin: Date;
}

export interface PlatformUserResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roles: string[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

export interface CreateUserResponseDto {
  id: string;
  email: string;
  status: string;
}

export interface CreatePlatformRoleDto {
  name: string;
  permissions: string[];
}

export interface CreateRoleDto {
  name: string;
  permissions: string[];
}

export enum Role {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export enum TenantRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export enum PlatformRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  AUDITOR = 'AUDITOR',
}

export enum Status {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  DELETED = 'DELETED',
}

export enum Permission {
  USER_CREATE = 'USER_CREATE',
  USER_UPDATE = 'USER_UPDATE',
  USER_DISABLE = 'USER_DISABLE',
  USER_DELETE = 'USER_DELETE',
  USER_RESTORE = 'USER_RESTORE',
  USER_VIEW = 'USER_VIEW',
  USER_VIEW_ALL = 'USER_VIEW_ALL',
  USER_ROLE_ASSIGN = 'USER_ROLE_ASSIGN',
  USER_ROLE_VIEW_OWN = 'USER_ROLE_VIEW_OWN',

  AUTH_REGISTER = 'AUTH_REGISTER',
  AUTH_LOGIN = 'AUTH_LOGIN',

  ROLE_CREATE = 'ROLE_CREATE',
  ROLE_UPDATE = 'ROLE_UPDATE',
  ROLE_DISABLE = 'ROLE_DISABLE',
  ROLE_RESTORE = 'ROLE_RESTORE',
  ROLE_VIEW = 'ROLE_VIEW',
  ROLE_VIEW_ALL = 'ROLE_VIEW_ALL',
  ROLE_DELETE = 'ROLE_DELETE',
  ROLE_ASSIGN = 'ROLE_ASSIGN',
  ROLE_REVOKE = 'ROLE_REVOKE',

  // Permission management permissions
  PERMISSION_CREATE = 'PERMISSION_CREATE',
  PERMISSION_UPDATE = 'PERMISSION_UPDATE',
  PERMISSION_DISABLE = 'PERMISSION_DISABLE',
  PERMISSION_DELETE = 'PERMISSION_DELETE',
  PERMISSION_RESTORE = 'PERMISSION_RESTORE',
  PERMISSION_VIEW = 'PERMISSION_VIEW',
  PERMISSION_VIEW_ALL = 'PERMISSION_VIEW_ALL',

  TENANT_CREATE = 'TENANT_CREATE',
  TENANT_UPDATE = 'TENANT_UPDATE',
  TENANT_DISABLE = 'TENANT_DISABLE',
  TENANT_DELETE = 'TENANT_DELETE',
  TENANT_RESTORE = 'TENANT_RESTORE',
  TENANT_VIEW = 'TENANT_VIEW',
  TENANT_VIEW_ALL = 'TENANT_VIEW_ALL',

  AUDIT_VIEW = 'AUDIT_VIEW',
  AUDIT_VIEW_ALL = 'AUDIT_VIEW_ALL',
  AUDIT_TENANT_VIEW = 'AUDIT_TENANT_VIEW',
}

export enum PlatformPermission {
  USER_CREATE = 'USER_CREATE',
  USER_UPDATE = 'USER_UPDATE',
  USER_DISABLE = 'USER_DISABLE',
  USER_DELETE = 'USER_DELETE',
  USER_RESTORE = 'USER_RESTORE',
  USER_VIEW = 'USER_VIEW',
  USER_VIEW_ALL = 'USER_VIEW_ALL',
  USER_ROLE_ASSIGN = 'USER_ROLE_ASSIGN',
  USER_ROLE_VIEW_OWN = 'USER_ROLE_VIEW_OWN',

  AUTH_REGISTER = 'AUTH_REGISTER',
  AUTH_LOGIN = 'AUTH_LOGIN',

  ROLE_CREATE = 'ROLE_CREATE',
  ROLE_UPDATE = 'ROLE_UPDATE',
  ROLE_DISABLE = 'ROLE_DISABLE',
  ROLE_DELETE = 'ROLE_DELETE',
  ROLE_RESTORE = 'ROLE_RESTORE',
  ROLE_VIEW = 'ROLE_VIEW',
  ROLE_VIEW_ALL = 'ROLE_VIEW_ALL',

  // Permission management permissions
  PERMISSION_CREATE = 'PERMISSION_CREATE',
  PERMISSION_UPDATE = 'PERMISSION_UPDATE',
  PERMISSION_DISABLE = 'PERMISSION_DISABLE',
  PERMISSION_DELETE = 'PERMISSION_DELETE',
  PERMISSION_RESTORE = 'PERMISSION_RESTORE',
  PERMISSION_VIEW = 'PERMISSION_VIEW',
  PERMISSION_VIEW_ALL = 'PERMISSION_VIEW_ALL',

  TENANT_CREATE = 'TENANT_CREATE',
  TENANT_UPDATE = 'TENANT_UPDATE',
  TENANT_DISABLE = 'TENANT_DISABLE',
  TENANT_DELETE = 'TENANT_DELETE',
  TENANT_RESTORE = 'TENANT_RESTORE',
  TENANT_VIEW = 'TENANT_VIEW',
  TENANT_VIEW_ALL = 'TENANT_VIEW_ALL',

  AUDIT_VIEW = 'AUDIT_VIEW',
  AUDIT_VIEW_ALL = 'AUDIT_VIEW_ALL',
  AUDIT_TENANT_VIEW = 'AUDIT_TENANT_VIEW',
}

export enum TenantPermission {
  USER_CREATE = 'USER_CREATE',
  USER_UPDATE = 'USER_UPDATE',
  USER_DISABLE = 'USER_DISABLE',
  USER_RESTORE = 'USER_RESTORE',
  USER_VIEW = 'USER_VIEW',
  USER_VIEW_ALL = 'USER_VIEW_ALL',

  AUTH_REGISTER = 'AUTH_REGISTER',
  AUTH_LOGIN = 'AUTH_LOGIN',

  ROLE_ASSIGN = 'ROLE_ASSIGN',
  ROLE_REVOKE = 'ROLE_REVOKE',
}

export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
  permissions: string[];
  tenantId?: string;
  type: JwtPayloadType;
}

export interface JwtEmailVerificationPayload {
  sub: string;
  email: string;
  type: JwtPayloadType.EMAIL_VERIFICATION;
}

export interface JwtPasswordResetPayload {
  sub: string;
  email: string;
  type: JwtPayloadType.PASSWORD_RESET;
}

export interface JwtRefreshPayload {
  sub: string;
  email?: string;
  type: JwtPayloadType.REFRESH;
}

export enum JwtPayloadType {
  PLATFORM = 'PLATFORM',
  LANDING = 'LANDING',
  TENANT = 'TENANT',
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  PASSWORD_RESET = 'PASSWORD_RESET',
  REFRESH = 'REFRESH',
}

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roles: string[];
}

export interface UserResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roles: string[];
  status: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}
