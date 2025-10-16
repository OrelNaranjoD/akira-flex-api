// auth/tenant/strategies/tenant-jwt.strategy.ts
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload, PlatformRole } from '../../../../core/shared/definitions';
import { TenantAuthService } from '../tenant-auth.service';

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
   * @param {JwtService} jwtService - JWT service for manual token validation.
   */
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: TenantAuthService,
    private readonly jwtService: JwtService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('JWT_SECRET', 'tenant-secret-key'),
      ignoreExpiration: false,
      passReqToCallback: true,
    });
  }

  /**
   * Validates JWT payload.
   * @param {Request} req - HTTP request.
   * @param {JwtPayload} payload - JWT payload.
   * @returns {Promise<JwtPayload>} Validated payload.
   */
  async validate(req: Request, payload: JwtPayload): Promise<JwtPayload> {
    console.log('TenantJwtStrategy - validating payload:', {
      sub: payload.sub,
      email: payload.email,
      roles: payload.roles,
      type: payload.type,
      hasSuperAdmin: payload.roles?.includes(PlatformRole.SUPER_ADMIN),
    });

    if (payload.roles?.includes(PlatformRole.SUPER_ADMIN)) {
      console.log('TenantJwtStrategy - SUPER_ADMIN access granted');
      return {
        sub: payload.sub,
        email: payload.email,
        roles: payload.roles,
        permissions: payload.permissions || [],
        type: payload.type,
      };
    }

    console.log('TenantJwtStrategy - validating regular tenant user');
    await this.authService.validatePayload(payload);

    return {
      sub: payload.sub,
      email: payload.email,
      roles: payload.roles,
      permissions: payload.permissions || [],
      tenantId: payload.tenantId,
      type: payload.type,
    };
  }
}
