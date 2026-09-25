import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marks a route as not requiring a JWT. Fail-safe by design: the global
 * `AuthGuard` protects everything by default, so a route added later without
 * this decorator stays protected instead of accidentally open.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
