import { CreateTenantUserDto } from '../dtos/create-tenant-user.dto';

/**
 * Command to create a new tenant user.
 */
export class CreateTenantUserCommand {
  /**
   * Creates an instance of CreateTenantUserCommand.
   * @param dto The DTO containing user creation data.
   */
  constructor(public readonly dto: CreateTenantUserDto) {}
}
