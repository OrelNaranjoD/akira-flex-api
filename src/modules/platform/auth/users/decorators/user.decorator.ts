import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to extract user from request.
 * @function User
 * @returns {ParameterDecorator}
 */
export const User = createParamDecorator((data: string, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const user = request.user;

  return data ? user?.[data] : user;
});
