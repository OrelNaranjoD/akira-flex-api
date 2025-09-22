import { PartialType } from '@nestjs/mapped-types';
import { CreatePlatformUserDto } from './create-platform-user.dto';
//@TODO Fix import to shared lib.
import { CreatePlatformUserDto as DefCreatePlatformUserDto } from '@shared';

/**
 * Data Transfer Object for updating an existing platform user.
 * @class UpdatePlatformUserDto
 * @augments PartialType<CreatePlatformUserDto>
 */
export class UpdatePlatformUserDto
  extends PartialType(CreatePlatformUserDto)
  implements Partial<DefCreatePlatformUserDto> {}
