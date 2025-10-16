/**
 * Data Transfer Object for register response.
 */
export interface RegisterResponseDto {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    createdAt: string;
  };
}
