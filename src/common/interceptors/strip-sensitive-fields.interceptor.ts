import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import { User } from '../../users/entities/user.entity.js';

function stripUser(user: User): Omit<User, 'passwordHash'> {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}

/**
 * Strips `passwordHash` from any `User` (or array of `User`) returned by a
 * handler. Reusable on every endpoint that returns a User, not just /auth/me.
 */
@Injectable()
export class StripSensitiveFieldsInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data: unknown) => {
        if (Array.isArray(data)) {
          return data.map((item) => (item instanceof User ? stripUser(item) : item));
        }
        return data instanceof User ? stripUser(data) : data;
      }),
    );
  }
}
