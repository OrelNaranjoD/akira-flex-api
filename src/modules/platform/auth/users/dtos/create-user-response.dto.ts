import { CreateUserResponseDto as DefCreateUserResponseDto } from '@definitions';

/**
 * DTO returned when a user is created.
 */
export class CreateUserResponseDto implements DefCreateUserResponseDto {
  id: string;
  email: string;
  status: string;
}
