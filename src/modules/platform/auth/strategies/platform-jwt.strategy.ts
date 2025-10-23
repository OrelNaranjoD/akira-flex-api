import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { JwtPayload } from '../../../../core/shared/definitions';
import { JwtPayloadType } from '../../../../core/shared/definitions';
import { PlatformAuthService } from '../platform-auth.service';
import { JwtKeyManagerService } from '../../../../core/token/keys/jwt-key-manager.service';

/**
 * JWT strategy for platform authentication with key rotation support.
 * @class PlatformJwtStrategy
 * @augments PassportStrategy(Strategy, 'platform-jwt')
 */
@Injectable()
export class PlatformJwtStrategy extends PassportStrategy(Strategy, 'platform-jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: PlatformAuthService,
    private readonly jwtKeyManager: JwtKeyManagerService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('JWT_PLATFORM_SECRET', 'platform-secret-key'),
      ignoreExpiration: false,
      passReqToCallback: true,
    });
  }

  /**
   * Validates JWT payload with key rotation support.
   * @param req - HTTP request.
   * @param token - Raw JWT token.
   * @returns Validated payload.
   */
  async validate(req: Request, token: string): Promise<JwtPayload> {
    // Verify token manually with key manager to support rotation
    let payload: JwtPayload;
    try {
      payload = await this.jwtKeyManager.verifyToken<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    if (payload.type !== JwtPayloadType.PLATFORM) {
      throw new UnauthorizedException('Invalid token type for platform access');
    }

    await this.authService.validatePayload(payload);

    return {
      sub: payload.sub,
      email: payload.email,
      roles: payload.roles,
      permissions: payload.permissions,
      type: payload.type,
      tenantId: payload.tenantId,
      isSuperAdmin: payload.isSuperAdmin,
    };
  }
}
