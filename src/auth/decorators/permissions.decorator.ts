import { SetMetadata } from '@nestjs/common';
import { Permission } from '../enums/permission.enum.js';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Pure metadata — just labels a route with the permissions it requires.
 * Enforcement lives entirely in PermissionsGuard, which is global (see
 * app.module.ts), so there is nothing to "forget" wiring up per route.
 */
export const Permissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
