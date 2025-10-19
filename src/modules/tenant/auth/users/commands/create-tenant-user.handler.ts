import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { TenantUser } from '../tenant-user.entity';
import { CreateTenantUserCommand } from './create-tenant-user.command';
import { TenantUserService } from '../tenant-user.service';

/**
 * Handler for creating a tenant user.
 */
@CommandHandler(CreateTenantUserCommand)
export class CreateTenantUserHandler implements ICommandHandler<CreateTenantUserCommand> {
  constructor(private readonly tenantUserService: TenantUserService) {}

  /**
   * Executes the command to create a tenant user.
   * @param command The create command.
   * @returns The created tenant user.
   */
  async execute(command: CreateTenantUserCommand): Promise<TenantUser> {
    return this.tenantUserService.createUser(command.dto);
  }
}
