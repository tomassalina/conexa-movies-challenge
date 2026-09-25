import { Reflector } from '@nestjs/core';
import { ANY_AUTHENTICATED_USER_KEY } from '../auth/decorators/any-authenticated-user.decorator.js';
import { PERMISSIONS_KEY } from '../auth/decorators/permissions.decorator.js';
import { Permission } from '../auth/enums/permission.enum.js';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface.js';
import { MoviesController } from './movies.controller.js';
import type { MoviesService } from './movies.service.js';

function buildController() {
  const moviesService = {
    findAllPaginated: vi.fn(),
    findOneOrFail: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    findCharacters: vi.fn(),
    findPlanets: vi.fn(),
    findSpecies: vi.fn(),
    findStarships: vi.fn(),
    findVehicles: vi.fn(),
  } as unknown as MoviesService;

  const controller = new MoviesController(moviesService);

  return { controller, moviesService };
}

const reflector = new Reflector();

function requiredPermissions(handler: (...args: never[]) => unknown) {
  return reflector.get<Permission[] | undefined>(PERMISSIONS_KEY, handler);
}

function isAnyAuthenticatedUser(handler: (...args: never[]) => unknown) {
  return reflector.get<boolean | undefined>(ANY_AUTHENTICATED_USER_KEY, handler);
}

describe('MoviesController', () => {
  describe('access control', () => {
    it('requires MOVIES_WRITE on create', () => {
      expect(requiredPermissions(MoviesController.prototype.create)).toEqual([
        Permission.MOVIES_WRITE,
      ]);
    });

    it('requires MOVIES_WRITE on update', () => {
      expect(requiredPermissions(MoviesController.prototype.update)).toEqual([
        Permission.MOVIES_WRITE,
      ]);
    });

    it('requires MOVIES_WRITE on remove', () => {
      expect(requiredPermissions(MoviesController.prototype.remove)).toEqual([
        Permission.MOVIES_WRITE,
      ]);
    });

    it('allows any authenticated user on findAll', () => {
      expect(isAnyAuthenticatedUser(MoviesController.prototype.findAll)).toBe(true);
    });

    it('allows any authenticated user on findOne', () => {
      expect(isAnyAuthenticatedUser(MoviesController.prototype.findOne)).toBe(true);
    });

    it('allows any authenticated user on every nested relation route', () => {
      expect(isAnyAuthenticatedUser(MoviesController.prototype.findCharacters)).toBe(true);
      expect(isAnyAuthenticatedUser(MoviesController.prototype.findPlanets)).toBe(true);
      expect(isAnyAuthenticatedUser(MoviesController.prototype.findSpecies)).toBe(true);
      expect(isAnyAuthenticatedUser(MoviesController.prototype.findStarships)).toBe(true);
      expect(isAnyAuthenticatedUser(MoviesController.prototype.findVehicles)).toBe(true);
    });
  });

  describe('findAll', () => {
    it('delegates to the service with the validated query', async () => {
      const { controller, moviesService } = buildController();
      const query = { page: 1, limit: 10, sortBy: 'createdAt' as const, order: 'desc' as const };
      const paginated = { data: [], meta: { total: 0, page: 1, totalPages: 0, hasNextPage: false, hasPreviousPage: false } };
      (moviesService.findAllPaginated as ReturnType<typeof vi.fn>).mockResolvedValue(paginated);

      const result = await controller.findAll(query);

      expect(moviesService.findAllPaginated).toHaveBeenCalledWith(query);
      expect(result).toBe(paginated);
    });
  });

  describe('findOne', () => {
    it('delegates to the service with the id', async () => {
      const { controller, moviesService } = buildController();
      const movie = { id: 'movie-1' };
      (moviesService.findOneOrFail as ReturnType<typeof vi.fn>).mockResolvedValue(movie);

      const result = await controller.findOne('movie-1');

      expect(moviesService.findOneOrFail).toHaveBeenCalledWith('movie-1');
      expect(result).toBe(movie);
    });
  });

  describe('create', () => {
    it('delegates to the service with the dto and the authenticated actor', async () => {
      const { controller, moviesService } = buildController();
      const dto = { title: 'A New Hope' };
      const request = { user: { sub: 'actor-user-id' } } as RequestWithUser;
      const movie = { id: 'movie-1', ...dto };
      (moviesService.create as ReturnType<typeof vi.fn>).mockResolvedValue(movie);

      const result = await controller.create(dto, request);

      expect(moviesService.create).toHaveBeenCalledWith(dto, 'actor-user-id');
      expect(result).toBe(movie);
    });
  });

  describe('update', () => {
    it('delegates to the service with id, dto, and the authenticated actor', async () => {
      const { controller, moviesService } = buildController();
      const dto = { title: 'New Title' };
      const request = { user: { sub: 'actor-user-id' } } as RequestWithUser;
      const movie = { id: 'movie-1', ...dto };
      (moviesService.update as ReturnType<typeof vi.fn>).mockResolvedValue(movie);

      const result = await controller.update('movie-1', dto, request);

      expect(moviesService.update).toHaveBeenCalledWith('movie-1', dto, 'actor-user-id');
      expect(result).toBe(movie);
    });
  });

  describe('remove', () => {
    it('delegates to the service with the id', async () => {
      const { controller, moviesService } = buildController();
      (moviesService.remove as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      await controller.remove('movie-1');

      expect(moviesService.remove).toHaveBeenCalledWith('movie-1');
    });
  });

  describe('nested relations', () => {
    it('findCharacters delegates to the service', async () => {
      const { controller, moviesService } = buildController();
      const characters = [{ id: 'char-1' }];
      (moviesService.findCharacters as ReturnType<typeof vi.fn>).mockResolvedValue(characters);

      const result = await controller.findCharacters('movie-1');

      expect(moviesService.findCharacters).toHaveBeenCalledWith('movie-1');
      expect(result).toBe(characters);
    });

    it('findPlanets delegates to the service', async () => {
      const { controller, moviesService } = buildController();
      const planets = [{ id: 'planet-1' }];
      (moviesService.findPlanets as ReturnType<typeof vi.fn>).mockResolvedValue(planets);

      const result = await controller.findPlanets('movie-1');

      expect(moviesService.findPlanets).toHaveBeenCalledWith('movie-1');
      expect(result).toBe(planets);
    });

    it('findSpecies delegates to the service', async () => {
      const { controller, moviesService } = buildController();
      const species = [{ id: 'species-1' }];
      (moviesService.findSpecies as ReturnType<typeof vi.fn>).mockResolvedValue(species);

      const result = await controller.findSpecies('movie-1');

      expect(moviesService.findSpecies).toHaveBeenCalledWith('movie-1');
      expect(result).toBe(species);
    });

    it('findStarships delegates to the service', async () => {
      const { controller, moviesService } = buildController();
      const starships = [{ id: 'starship-1' }];
      (moviesService.findStarships as ReturnType<typeof vi.fn>).mockResolvedValue(starships);

      const result = await controller.findStarships('movie-1');

      expect(moviesService.findStarships).toHaveBeenCalledWith('movie-1');
      expect(result).toBe(starships);
    });

    it('findVehicles delegates to the service', async () => {
      const { controller, moviesService } = buildController();
      const vehicles = [{ id: 'vehicle-1' }];
      (moviesService.findVehicles as ReturnType<typeof vi.fn>).mockResolvedValue(vehicles);

      const result = await controller.findVehicles('movie-1');

      expect(moviesService.findVehicles).toHaveBeenCalledWith('movie-1');
      expect(result).toBe(vehicles);
    });
  });
});
