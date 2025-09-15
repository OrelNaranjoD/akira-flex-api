import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to extract platform user from request.
 * @function PlatformUser
 * @returns {ParameterDecorator}
 */
export const PlatformUser = createParamDecorator((data: string, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const user = request.user;

  return data ? user?.[data] : user;
});
