import { Controller, Get, Req, Post, Res, UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { PlatformAuthService } from '../../modules/platform/auth/platform-auth.service';
import { TenantAuthService } from '../../modules/tenant/auth/tenant-auth.service';
import { JwtPayload } from '../shared/definitions';
import { User } from '../../modules/platform/auth/users/entities/user.entity';
import { PlatformUser } from '../../modules/platform/auth/platform-users/entities/platform-user.entity';
import { TokenService } from '../token/token.service';

/**
 * Generic authentication controller that routes requests based on user type.
 */
@Controller('auth')
export class AuthController {
  constructor(
    private readonly platformAuthService: PlatformAuthService,
    private readonly tenantAuthService: TenantAuthService,
    private readonly tokenService: TokenService
  ) {}

  /**
   * Generic profile endpoint that routes based on user type.
   * @param req - Request object containing authenticated user.
   * @returns User profile data.
   */
  @Get('profile')
  async getProfile(@Req() req: Request): Promise<any> {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);
    let payload: JwtPayload;
    try {
      payload = await this.tokenService.verifyToken<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
    req.user = payload;

    if (payload.type === 'TENANT') {
      const user = await this.tenantAuthService.validatePayload(payload);
      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        roles: user.roles,
        active: user.active,
        tenantId: user.tenantId,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLogin: user.lastLogin,
      };
    } else {
      let user: User | PlatformUser;
      if (payload.type === 'PLATFORM') {
        user = await this.platformAuthService.findPlatformUser(payload.sub);
      } else {
        user = await this.platformAuthService.findUser(payload.sub);
      }
      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        roles: user.roles.map((r) => r.name),
        type: payload.type,
        status: 'status' in user ? user.status : undefined,
        active: 'active' in user ? user.active : undefined,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLogin: user.lastLogin,
      };
    }
  }

  /**
   * Generic logout endpoint that invalidates refresh tokens and clears cookies.
   * @param req - Request object containing JWT token and cookies.
   * @param res - Response object to clear cookies.
   * @returns Logout confirmation message.
   */
  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ): Promise<{ message: string }> {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);
    let payload: JwtPayload;
    try {
      payload = await this.tokenService.verifyToken<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    if (payload.type === 'TENANT') {
      const tenantId = payload.tenantId || (req.headers['x-tenant-id'] as string);
      if (!tenantId) {
        throw new UnauthorizedException('Tenant ID required for tenant logout');
      }
      return this.tenantAuthService.logoutFromRequest(req, res, undefined, tenantId);
    } else {
      return this.platformAuthService.logoutFromRequest(req, res);
    }
  }
}
