import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../users/enums/role.enum.js';
import { ROLE_PERMISSIONS } from '../constants/role-permissions.js';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator.js';
import { Permission } from '../enums/permission.enum.js';

/**
 * Not global (unlike AuthGuard): applied per-route with
 * `@UseGuards(PermissionsGuard)` + `@RequirePermissions(...)`, since most
 * routes only need "is this user authenticated", not a specific permission.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const role: Role | undefined = request.user?.role;
    const grantedPermissions = role ? ROLE_PERMISSIONS[role] : [];

    const hasAllPermissions = requiredPermissions.every((permission) =>
      grantedPermissions.includes(permission),
    );
    if (!hasAllPermissions) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }
}
