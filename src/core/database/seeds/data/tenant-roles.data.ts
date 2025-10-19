/**
 * Tenant roles data with permission assignments.
 */
export const TENANT_ROLES_DATA = [
  {
    name: 'OWNER',
    description: 'Owner with all permissions',
    getPermissions: (allPermissions: string[]) => allPermissions,
  },
  {
    name: 'ADMIN',
    description: 'Administrator with most permissions',
    getPermissions: (allPermissions: string[]) =>
      allPermissions.filter(
        (code) => !['USER_DELETE', 'TENANT_DELETE', 'AUDIT_VIEW_ALL'].includes(code)
      ),
  },
  {
    name: 'MANAGER',
    description: 'Manager with user and role management permissions',
    getPermissions: () => [
      'USER_VIEW',
      'USER_VIEW_ALL',
      'USER_CREATE',
      'USER_UPDATE',
      'ROLE_VIEW',
      'ROLE_VIEW_ALL',
      'PERMISSION_VIEW',
      'TENANT_VIEW',
    ],
  },
  {
    name: 'USER',
    description: 'Regular user with basic permissions',
    getPermissions: () => [
      'USER_VIEW',
      'USER_ROLE_VIEW_OWN',
      'AUTH_LOGIN',
      'ROLE_VIEW',
      'PERMISSION_VIEW',
      'TENANT_VIEW',
    ],
  },
];
