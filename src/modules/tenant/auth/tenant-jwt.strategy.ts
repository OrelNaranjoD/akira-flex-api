// auth/tenant/strategies/tenant-jwt.strategy.ts
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TenantAuthService } from './tenant-auth.service';
import { JwtPayload } from '@orelnaranjod/flex-shared-lib';

/**
 * JWT strategy for tenant authentication.
 * @class TenantJwtStrategy
 * @augments PassportStrategy(Strategy, 'tenant-jwt')
 */
@Injectable()
export class TenantJwtStrategy extends PassportStrategy(Strategy, 'tenant-jwt') {
  /**
   * Creates an instance of TenantJwtStrategy.
   * @param {ConfigService} configService - Configuration service.
   * @param {TenantAuthService} authService - Tenant authentication service.
   */
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: TenantAuthService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('JWT_TENANT_SECRET', 'tenant-secret-key'),
      ignoreExpiration: false,
    });
  }

  /**
   * Validates JWT payload.
   * @param {JwtPayload} payload - JWT payload.
   * @returns {Promise<JwtPayload>} Validated payload.
   */
  async validate(payload: JwtPayload): Promise<JwtPayload> {
    // Verify user exists and is active
    await this.authService.validatePayload(payload);

    return {
      sub: payload.sub,
      email: payload.email,
      roles: payload.roles,
      tenantId: payload.tenantId,
      type: payload.type,
    };
  }
}
