import { Expose } from 'class-transformer';
import { Permission } from '../../permissions/entities/permission.entity';

/**
 * DTO para la respuesta de un rol.
 */
export class RoleResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  active: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  permissions: Permission[];
}
