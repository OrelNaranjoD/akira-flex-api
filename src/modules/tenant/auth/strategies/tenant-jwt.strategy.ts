// auth/tenant/strategies/tenant-jwt.strategy.ts
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload, PlatformRole } from '../../../../core/shared/definitions';
import { TenantAuthService } from '../tenant-auth.service';
import { TenantService } from '../../../platform/tenants/services/tenant.service';
import { JwtKeyManagerService } from '../../../../core/token/keys/jwt-key-manager.service';

/**
 * JWT strategy for tenant authentication with key rotation support.
 * @class TenantJwtStrategy
 * @augments PassportStrategy(Strategy, 'tenant-jwt')
 */
@Injectable()
export class TenantJwtStrategy extends PassportStrategy(Strategy, 'tenant-jwt') {
  /**
   * Creates an instance of TenantJwtStrategy.
   * @param configService - Configuration service.
   * @param authService - Tenant authentication service.
   * @param jwtService - JWT service for manual token validation.
   * @param tenantService - Tenant service.
   * @param jwtKeyManager - JWT key manager for rotation support.
   */
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: TenantAuthService,
    private readonly jwtService: JwtService,
    private readonly tenantService: TenantService,
    private readonly jwtKeyManager: JwtKeyManagerService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('JWT_TENANT_SECRET', 'tenant-secret-key'),
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
    let payload: JwtPayload;
    try {
      payload = await this.jwtKeyManager.verifyToken<JwtPayload>(token);
    } catch {
      throw new Error('Token verification failed');
    }

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

    const tenant = await this.tenantService.findOneInternal(payload.tenantId!);
    const schemaName = tenant.schemaName;

    return {
      sub: payload.sub,
      email: payload.email,
      roles: payload.roles,
      permissions: payload.permissions || [],
      tenantId: payload.tenantId,
      schemaName,
      type: payload.type,
    };
  }
}
