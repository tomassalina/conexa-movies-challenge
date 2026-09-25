import { SetMetadata } from '@nestjs/common';

export const ANY_AUTHENTICATED_USER_KEY = 'anyAuthenticatedUser';

/**
 * Marks a route as requiring authentication but no specific permission —
 * any logged-in user may call it (e.g. self-service endpoints like
 * `GET /auth/me`). Required because PermissionsGuard now fails closed:
 * a route with neither `@Public()`, `@Permissions(...)`, nor this decorator
 * is treated as misconfigured and rejected.
 */
export const AnyAuthenticatedUser = () =>
  SetMetadata(ANY_AUTHENTICATED_USER_KEY, true);
