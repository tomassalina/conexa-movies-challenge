import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { PERMISSIONS_KEY } from '../constants/permissions-metadata.key.js';
import { PermissionsGuard } from '../guards/permissions.guard.js';
import { Permission } from '../enums/permission.enum.js';

/**
 * Bundles PermissionsGuard with the metadata it reads, so a route can never
 * declare a permission requirement without the guard that enforces it (and
 * vice versa) — removes the fail-open risk of forgetting one of the two.
 */
export const RequirePermissions = (...permissions: Permission[]) =>
  applyDecorators(
    UseGuards(PermissionsGuard),
    SetMetadata(PERMISSIONS_KEY, permissions),
  );
