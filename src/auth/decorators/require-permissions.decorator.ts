import { SetMetadata } from '@nestjs/common';
import { PERMISSIONS_KEY } from '../constants/permissions-metadata.key.js';
import { Permission } from '../enums/permission.enum.js';

/**
 * Pure metadata — just labels a route with the permissions it requires.
 * Enforcement lives entirely in PermissionsGuard, which is global (see
 * auth.module.ts), so there is nothing to "forget" wiring up per route.
 */
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
