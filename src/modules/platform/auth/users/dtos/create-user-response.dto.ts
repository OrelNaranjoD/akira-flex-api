import { CreateUserResponseDto as DefCreateUserResponseDto } from '@shared';

/**
 * DTO returned when a user is created.
 */
export class CreateUserResponseDto implements DefCreateUserResponseDto {
  id: string;
  email: string;
  status: string;
}
