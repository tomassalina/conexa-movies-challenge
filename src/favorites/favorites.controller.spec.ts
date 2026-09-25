import { Reflector } from '@nestjs/core';
import { ANY_AUTHENTICATED_USER_KEY } from '../auth/decorators/any-authenticated-user.decorator.js';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface.js';
import { Movie } from '../movies/entities/movie.entity.js';
import { FavoritesController } from './favorites.controller.js';
import type { FavoritesService } from './favorites.service.js';

describe('FavoritesController', () => {
  describe('access control', () => {
    // Same discovery mechanism PermissionsGuard uses at request time (see
    // permissions.guard.spec.ts) — proves every route here is open to any
    // authenticated user, with no admin/permission distinction, since
    // favoriting is a personal action.
    const reflector = new Reflector();

    it('marks add as @AnyAuthenticatedUser()', () => {
      expect(
        reflector.get<boolean | undefined>(
          ANY_AUTHENTICATED_USER_KEY,
          FavoritesController.prototype.add,
        ),
      ).toBe(true);
    });

    it('marks remove as @AnyAuthenticatedUser()', () => {
      expect(
        reflector.get<boolean | undefined>(
          ANY_AUTHENTICATED_USER_KEY,
          FavoritesController.prototype.remove,
        ),
      ).toBe(true);
    });

    it('marks findAll as @AnyAuthenticatedUser()', () => {
      expect(
        reflector.get<boolean | undefined>(
          ANY_AUTHENTICATED_USER_KEY,
          FavoritesController.prototype.findAll,
        ),
      ).toBe(true);
    });
  });

  describe('anti-privilege-escalation: user id always comes from the JWT', () => {
    const movieId = 'movie-1';
    const authenticatedUserId = 'authenticated-user-id';

    function createRequest(): RequestWithUser {
      return { user: { sub: authenticatedUserId } } as RequestWithUser;
    }

    it('add() uses request.user.sub, ignoring any userId elsewhere on the request', async () => {
      const favoritesService = {
        add: vi.fn().mockResolvedValue({ userId: authenticatedUserId, movieId }),
      } as unknown as FavoritesService;
      const controller = new FavoritesController(favoritesService);
      // Simulates a malicious client trying to smuggle another user's id in
      // the body; the controller has no @Body() param at all for this route,
      // so there is no way for it to reach the service even if present.
      const request = {
        ...createRequest(),
        body: { userId: 'someone-elses-id' },
      } as unknown as RequestWithUser;

      await controller.add(movieId, request);

      expect(favoritesService.add).toHaveBeenCalledWith(authenticatedUserId, movieId);
      expect(favoritesService.add).not.toHaveBeenCalledWith('someone-elses-id', movieId);
    });

    it('remove() uses request.user.sub, ignoring any userId elsewhere on the request', async () => {
      const favoritesService = {
        remove: vi.fn().mockResolvedValue(undefined),
      } as unknown as FavoritesService;
      const controller = new FavoritesController(favoritesService);
      const request = {
        ...createRequest(),
        body: { userId: 'someone-elses-id' },
      } as unknown as RequestWithUser;

      await controller.remove(movieId, request);

      expect(favoritesService.remove).toHaveBeenCalledWith(authenticatedUserId, movieId);
      expect(favoritesService.remove).not.toHaveBeenCalledWith('someone-elses-id', movieId);
    });

    it('findAll() lists favorites for request.user.sub only, never a query/body-supplied id', async () => {
      const movie = { id: movieId, title: 'A New Hope' } as Movie;
      const paginated = {
        data: [movie],
        meta: { total: 1, page: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
      };
      const favoritesService = {
        findAllForUser: vi.fn().mockResolvedValue(paginated),
      } as unknown as FavoritesService;
      const controller = new FavoritesController(favoritesService);
      const request = {
        ...createRequest(),
        query: { userId: 'someone-elses-id' },
      } as unknown as RequestWithUser;
      const query = { page: 1, limit: 10, sortBy: 'createdAt' as const, order: 'desc' as const };

      const result = await controller.findAll(request, query);

      expect(favoritesService.findAllForUser).toHaveBeenCalledWith(authenticatedUserId, query);
      expect(favoritesService.findAllForUser).not.toHaveBeenCalledWith('someone-elses-id', query);
      expect(result).toEqual(paginated);
    });
  });
});
