import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../users/enums/role.enum.js';
import { RolePermissions } from '../constants/role-permissions.mapping.js';
import { ANY_AUTHENTICATED_USER_KEY } from '../decorators/any-authenticated-user.decorator.js';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator.js';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import { Permission } from '../enums/permission.enum.js';

/**
 * Registered globally (see app.module.ts), so every route is checked.
 *
 * Fails closed: a route must explicitly declare its authorization intent
 * via `@Public()`, `@Permissions(...)`, or `@AnyAuthenticatedUser()`. A
 * route with none of these is treated as misconfigured and rejected,
 * rather than silently allowed.
 *
 * Precedence when a route carries more than one of these decorators:
 * `@Public()` > `@Permissions(...)` > `@AnyAuthenticatedUser()`.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredPermissions || requiredPermissions.length === 0) {
      const isAnyAuthenticatedUser = this.reflector.getAllAndOverride<boolean>(
        ANY_AUTHENTICATED_USER_KEY,
        [context.getHandler(), context.getClass()],
      );
      if (isAnyAuthenticatedUser) {
        return true;
      }

      throw new ForbiddenException(
        'Endpoint is missing an authorization decorator: add @Public, @Permissions, or @AnyAuthenticatedUser',
      );
    }

    const request = context.switchToHttp().getRequest();
    const role: Role | undefined = request.user?.role;
    const grantedPermissions = role ? RolePermissions[role] : [];

    const hasAllPermissions = requiredPermissions.every((permission) =>
      grantedPermissions.includes(permission),
    );
    if (!hasAllPermissions) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }
}
