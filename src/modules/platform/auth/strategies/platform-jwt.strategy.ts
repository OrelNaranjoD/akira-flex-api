import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { JwtPayload } from '../../../../core/shared/definitions';
import { JwtPayloadType } from '../../../../core/shared/definitions';
import { PlatformAuthService } from '../platform-auth.service';

/**
 * JWT strategy for platform authentication.
 * @class PlatformJwtStrategy
 * @augments PassportStrategy(Strategy, 'platform-jwt')
 */
@Injectable()
export class PlatformJwtStrategy extends PassportStrategy(Strategy, 'platform-jwt') {
  /**
   * Creates an instance of PlatformJwtStrategy.
   * @param {ConfigService} configService - Configuration service.
   * @param {PlatformAuthService} authService - Platform authentication service.
   */
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: PlatformAuthService
  ) {
    const secretKey = configService.get('JWT_SECRET', 'platform-secret-key');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secretKey,
      ignoreExpiration: false,
    });
  }

  /**
   * Validates JWT payload.
   * @param {JwtPayload} payload - JWT payload.
   * @returns {Promise<JwtPayload>} Validated payload.
   */
  async validate(payload: JwtPayload): Promise<JwtPayload> {
    if (payload.type !== JwtPayloadType.PLATFORM) {
      throw new UnauthorizedException('Invalid token type for platform access');
    }
    // Verify user exists and is active
    await this.authService.validatePayload(payload);

    return {
      sub: payload.sub,
      email: payload.email,
      roles: payload.roles,
      permissions: payload.permissions,
      type: payload.type,
      tenantId: payload.tenantId,
    };
  }
}
