import { IsUUID, IsArray, ArrayNotEmpty } from 'class-validator';

/**
 * DTO for associating tenants to a platform user.
 */
export class AssociateTenantsDto {
  /**
   * Array of tenant IDs to associate with the user.
   * @type {string[]}
   */
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  tenantIds: string[];
}
