import { IsOptional, IsString, IsBoolean, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for JWT key statistics response.
 */
export class JwtKeyStatsDto {
  @ApiProperty({
    description: 'Active key information',
    type: 'object',
    properties: {
      id: { type: 'string', example: 'uuid-key-123' },
      createdAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' },
      usageCount: { type: 'number', example: 150 },
    },
  })
  activeKey: {
    id: string;
    createdAt: Date;
    usageCount: number;
  };

  @ApiProperty({
    description: 'Total number of keys in the system',
    example: 6,
  })
  totalKeys: number;

  @ApiProperty({
    description: 'Number of inactive keys',
    example: 5,
  })
  inactiveKeys: number;
}

/**
 * DTO for manual key rotation request.
 */
export class RotateJwtKeyDto {
  @ApiPropertyOptional({
    description: 'User or system that triggered the rotation',
    example: 'admin-user-123',
  })
  @IsOptional()
  @IsString()
  deactivatedBy?: string;

  @ApiPropertyOptional({
    description: 'Reason for the key rotation',
    example: 'Security incident response',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

/**
 * DTO for key rotation response.
 */
export class JwtKeyRotationResponseDto {
  @ApiProperty({
    description: 'ID of the new active key',
    example: 'uuid-key-123',
  })
  newKeyId: string;

  @ApiProperty({
    description: 'Timestamp when the rotation was performed',
    example: '2024-01-15T10:30:00Z',
  })
  rotatedAt: Date;

  @ApiPropertyOptional({
    description: 'User or system that triggered the rotation',
    example: 'admin-user-123',
  })
  deactivatedBy?: string;

  @ApiPropertyOptional({
    description: 'Reason for the rotation',
    example: 'Manual rotation for security',
  })
  reason?: string;
}

/**
 * DTO for JWT key rotation configuration.
 */
export class JwtKeyConfigDto {
  @ApiProperty({
    description: 'Whether automatic key rotation is enabled',
    example: true,
  })
  enabled: boolean;

  @ApiProperty({
    description: 'Interval in hours for automatic rotation',
    example: 24,
    minimum: 1,
    maximum: 168, // 1 week
  })
  @IsNumber()
  @Min(1)
  @Max(168)
  intervalHours: number;

  @ApiProperty({
    description: 'Number of old keys to retain for backward compatibility',
    example: 5,
    minimum: 1,
    maximum: 10,
  })
  @IsNumber()
  @Min(1)
  @Max(10)
  retentionCount: number;
}

/**
 * DTO for updating JWT key rotation configuration.
 */
export class UpdateJwtKeyConfigDto {
  @ApiPropertyOptional({
    description: 'Whether automatic key rotation should be enabled',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({
    description: 'Interval in hours for automatic rotation',
    example: 48,
    minimum: 1,
    maximum: 168,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(168)
  intervalHours?: number;

  @ApiPropertyOptional({
    description: 'Number of old keys to retain for backward compatibility',
    example: 3,
    minimum: 1,
    maximum: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  retentionCount?: number;
}
