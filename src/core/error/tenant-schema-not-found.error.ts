/**
 * Custom error thrown when a tenant's schema does not exist in the database.
 */
export class TenantSchemaNotFoundError extends Error {
  constructor(schemaName: string) {
    super(`The tenant schema "${schemaName}" does not exist in the database.`);
    this.name = 'TenantSchemaNotFoundError';
  }
}
