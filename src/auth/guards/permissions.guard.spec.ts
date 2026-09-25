import type { ExecutionContext } from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { Role } from '../../users/enums/role.enum.js';
import { Permission } from '../enums/permission.enum.js';
import { PermissionsGuard } from './permissions.guard.js';

function createContext(role: Role, requiredPermissions?: Permission[]) {
  const reflector = {
    getAllAndOverride: vi.fn().mockReturnValue(requiredPermissions),
  } as unknown as Reflector;
  const context = {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({
      getRequest: () => ({ user: { role } }),
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

  it('allows access when no permissions are required on the route', () => {
    const { reflector, context } = createContext(Role.USER, undefined);
    const guard = new PermissionsGuard(reflector);

    expect(guard.canActivate(context)).toBe(true);
  });
});
