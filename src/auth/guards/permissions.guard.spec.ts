import type { ExecutionContext } from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { Role } from '../../users/enums/role.enum.js';
import { ANY_AUTHENTICATED_USER_KEY } from '../decorators/any-authenticated-user.decorator.js';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator.js';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import { Permission } from '../enums/permission.enum.js';
import { PermissionsGuard } from './permissions.guard.js';

function createContext(
  role: Role | undefined,
  requiredPermissions?: Permission[],
  isPublic = false,
  isAnyAuthenticatedUser = false,
) {
  const metadataByKey: Record<string, unknown> = {
    [IS_PUBLIC_KEY]: isPublic,
    [PERMISSIONS_KEY]: requiredPermissions,
    [ANY_AUTHENTICATED_USER_KEY]: isAnyAuthenticatedUser,
  };
  const reflector = {
    getAllAndOverride: vi.fn((key: string) => metadataByKey[key]),
  } as unknown as Reflector;
  const context = {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({
      getRequest: () => (role ? { user: { role } } : {}),
    }),
  } as unknown as ExecutionContext;
  return { reflector, context };
}

describe('PermissionsGuard', () => {
  it('allows access when the role has the required permission', () => {
    const { reflector, context } = createContext(Role.ADMIN, [
      Permission.MOVIES_WRITE,
    ]);
    const guard = new PermissionsGuard(reflector);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('throws ForbiddenException when the role lacks the required permission', () => {
    const { reflector, context } = createContext(Role.USER, [
      Permission.MOVIES_WRITE,
    ]);
    const guard = new PermissionsGuard(reflector);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException (not a crash) when permissions are required but the request has no user', () => {
    const { reflector, context } = createContext(undefined, [
      Permission.MOVIES_WRITE,
    ]);
    const guard = new PermissionsGuard(reflector);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('allows access to a @Public() route even without a user on the request', () => {
    const { reflector, context } = createContext(
      undefined,
      [Permission.MOVIES_WRITE],
      true,
    );
    const guard = new PermissionsGuard(reflector);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows access to an @AnyAuthenticatedUser() route with an authenticated user', () => {
    const { reflector, context } = createContext(
      Role.USER,
      undefined,
      false,
      true,
    );
    const guard = new PermissionsGuard(reflector);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('throws ForbiddenException when a route has no @Public, @Permissions, or @AnyAuthenticatedUser decorator', () => {
    const { reflector, context } = createContext(
      Role.USER,
      undefined,
      false,
      false,
    );
    const guard = new PermissionsGuard(reflector);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
