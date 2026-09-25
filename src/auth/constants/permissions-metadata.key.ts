/**
 * Shared metadata key between `RequirePermissions` (writer) and
 * `PermissionsGuard` (reader). Lives in its own file so neither has to
 * import the other directly — avoids a circular import now that
 * `RequirePermissions` also applies `PermissionsGuard` via `applyDecorators`.
 */
export const PERMISSIONS_KEY = 'permissions';
