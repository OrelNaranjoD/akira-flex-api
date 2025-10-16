import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
//@TODO Fix import to shared lib.
import { CreateUserDto as DefCreateUserDto } from '@shared';

/**
 * Data Transfer Object for updating an existing  user.
 * @class UpdateUserDto
 * @augments PartialType<CreateUserDto>
 */
export class UpdateUserDto
  extends PartialType(CreateUserDto)
  implements Partial<DefCreateUserDto> {}
