import { PartialType } from '@nestjs/mapped-types';
import { CreateUserPlatformDto } from './create-user-platform.dto';

/**
 * Data Transfer Object for updating an existing platform user.
 * @class UpdateUserPlatformDto
 * @augments PartialType<CreateUserPlatformDto>
 */
export class UpdateUserPlatformDto extends PartialType(CreateUserPlatformDto) {}
