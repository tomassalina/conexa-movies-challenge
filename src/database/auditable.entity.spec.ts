import { instanceToPlain } from 'class-transformer';
import { Favorite } from '../favorites/entities/favorite.entity.js';
import { Movie } from '../movies/entities/movie.entity.js';
import type { User } from '../users/entities/user.entity.js';

// Regression test for the bug where controllers returned raw TypeORM
// entities built with a stub `createdBy: { id } as User` relation object
// (never a fully-loaded User). `ClassSerializerInterceptor` (wired globally
// in main.ts) relies on `@Exclude()` on `AuditableEntity`/`CreatedAuditEntity`
// to strip those redundant relation objects while keeping the useful
// `createdById`/`updatedById`/`deletedById` scalar columns. This exercises
// the exact serialization path (`instanceToPlain`, what the interceptor
// calls under the hood) directly against real entity instances, since
// TypeORM entities are actual class instances rather than plain objects.
describe('AuditableEntity / CreatedAuditEntity serialization', () => {
  const actorId = 'actor-user-id';

  it('excludes createdBy/updatedBy but keeps createdById/updatedById for an AuditableEntity subclass', () => {
    const movie = Object.assign(new Movie(), {
      id: 'movie-id',
      title: 'A New Hope',
      createdAt: new Date('2024-01-01T00:00:00Z'),
      createdBy: { id: actorId } as User,
      createdById: actorId,
      updatedAt: new Date('2024-01-01T00:00:00Z'),
      updatedBy: { id: actorId } as User,
      updatedById: actorId,
    });

    const plain = instanceToPlain(movie);

    expect(plain).not.toHaveProperty('createdBy');
    expect(plain).not.toHaveProperty('updatedBy');
    expect(plain.createdById).toBe(actorId);
    expect(plain.updatedById).toBe(actorId);
  });

  it('excludes deletedBy but keeps deletedById for an AuditableEntity subclass', () => {
    const movie = Object.assign(new Movie(), {
      id: 'movie-id',
      title: 'A New Hope',
      deletedBy: { id: actorId } as User,
      deletedById: actorId,
    });

    const plain = instanceToPlain(movie);

    expect(plain).not.toHaveProperty('deletedBy');
    expect(plain.deletedById).toBe(actorId);
  });

  it('excludes createdBy but keeps createdById for a CreatedAuditEntity subclass', () => {
    const favorite = Object.assign(new Favorite(), {
      userId: 'user-id',
      movieId: 'movie-id',
      createdAt: new Date('2024-01-01T00:00:00Z'),
      createdBy: { id: actorId } as User,
      createdById: actorId,
    });

    const plain = instanceToPlain(favorite);

    expect(plain).not.toHaveProperty('createdBy');
    expect(plain.createdById).toBe(actorId);
  });
});
