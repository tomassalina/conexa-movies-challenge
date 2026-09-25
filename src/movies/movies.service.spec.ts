import { NotFoundException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import type { Movie } from './entities/movie.entity.js';
import type { MovieCharacter } from './entities/movie-character.entity.js';
import type { MoviePlanet } from './entities/movie-planet.entity.js';
import type { MovieSpecies } from './entities/movie-species.entity.js';
import type { MovieStarship } from './entities/movie-starship.entity.js';
import type { MovieVehicle } from './entities/movie-vehicle.entity.js';
import type { ListMoviesQueryDto } from './dto/list-movies-query.dto.js';
import type { ListRelatedQueryDto } from './dto/list-related-query.dto.js';
import { createMovieSchema } from './dto/create-movie.dto.js';
import { updateMovieSchema } from './dto/update-movie.dto.js';
import { MoviesService } from './movies.service.js';

const ACTOR_USER_ID = 'actor-user-id';

function buildService() {
  const moviesRepository = {
    findOneBy: vi.fn(),
    findAndCount: vi.fn(),
    create: vi.fn((input: Partial<Movie>) => input as Movie),
    save: vi.fn(async (input: Movie) => input),
    softDelete: vi.fn(),
    upsert: vi.fn(),
  } as unknown as Repository<Movie>;

  const moviePlanetRepository = {
    findAndCount: vi.fn(),
    upsert: vi.fn(),
  } as unknown as Repository<MoviePlanet>;

  const movieCharacterRepository = {
    findAndCount: vi.fn(),
    upsert: vi.fn(),
  } as unknown as Repository<MovieCharacter>;

  const movieSpeciesRepository = {
    findAndCount: vi.fn(),
    upsert: vi.fn(),
  } as unknown as Repository<MovieSpecies>;

  const movieStarshipRepository = {
    findAndCount: vi.fn(),
    upsert: vi.fn(),
  } as unknown as Repository<MovieStarship>;

  const movieVehicleRepository = {
    findAndCount: vi.fn(),
    upsert: vi.fn(),
  } as unknown as Repository<MovieVehicle>;

  const service = new MoviesService(
    moviesRepository,
    moviePlanetRepository,
    movieCharacterRepository,
    movieSpeciesRepository,
    movieStarshipRepository,
    movieVehicleRepository,
  );

  return {
    service,
    moviesRepository,
    moviePlanetRepository,
    movieCharacterRepository,
    movieSpeciesRepository,
    movieStarshipRepository,
    movieVehicleRepository,
  };
}

function baseQuery(overrides: Partial<ListMoviesQueryDto> = {}): ListMoviesQueryDto {
  return {
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    order: 'desc',
    ...overrides,
  };
}

function baseRelatedQuery(overrides: Partial<ListRelatedQueryDto> = {}): ListRelatedQueryDto {
  return {
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    order: 'desc',
    ...overrides,
  };
}

describe('MoviesService', () => {
  describe('createMovieSchema / episodeId bounds', () => {
    it('rejects an episodeId above the smallint column range instead of letting it reach Postgres', () => {
      const result = createMovieSchema.safeParse({
        title: 'The Empire Strikes Back',
        episodeId: 9007199254740991,
      });

      expect(result.success).toBe(false);
    });

    it('rejects a zero or negative episodeId', () => {
      expect(createMovieSchema.safeParse({ title: 'X', episodeId: 0 }).success).toBe(false);
      expect(createMovieSchema.safeParse({ title: 'X', episodeId: -1 }).success).toBe(false);
    });

    it('accepts a valid episode number within the smallint range', () => {
      const result = createMovieSchema.safeParse({
        title: 'The Empire Strikes Back',
        episodeId: 5,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('updateMovieSchema / episodeId bounds', () => {
    it('rejects an episodeId above the smallint column range', () => {
      const result = updateMovieSchema.safeParse({ episodeId: 9007199254740991 });

      expect(result.success).toBe(false);
    });

    it('accepts a valid episode number within the smallint range', () => {
      const result = updateMovieSchema.safeParse({ episodeId: 5 });

      expect(result.success).toBe(true);
    });
  });

  describe('create', () => {
    it('creates a movie with swapiId forced to null and stamps created/updated by the actor', async () => {
      const { service, moviesRepository } = buildService();
      const dto = { title: 'A New Hope' };

      const movie = await service.create(dto, ACTOR_USER_ID);

      expect(moviesRepository.create).toHaveBeenCalledWith({
        title: 'A New Hope',
        swapiId: null,
        createdBy: { id: ACTOR_USER_ID },
        updatedBy: { id: ACTOR_USER_ID },
      });
      expect(moviesRepository.save).toHaveBeenCalledWith(movie);
    });
  });

  describe('findAllPaginated', () => {
    it('computes pagination meta correctly on the first page with more pages remaining', async () => {
      const { service, moviesRepository } = buildService();
      const data = [{ id: '1' }, { id: '2' }] as Movie[];
      (moviesRepository.findAndCount as ReturnType<typeof vi.fn>).mockResolvedValue([
        data,
        25,
      ]);

      const result = await service.findAllPaginated(baseQuery({ page: 1, limit: 10 }));

      expect(result.data).toBe(data);
      expect(result.meta).toEqual({
        total: 25,
        page: 1,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: false,
      });
      expect(moviesRepository.findAndCount).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 10,
      });
    });

    it('computes pagination meta correctly on the last page', async () => {
      const { service, moviesRepository } = buildService();
      (moviesRepository.findAndCount as ReturnType<typeof vi.fn>).mockResolvedValue([
        [{ id: '21' }, { id: '22' }] as Movie[],
        25,
      ]);

      const result = await service.findAllPaginated(baseQuery({ page: 3, limit: 10 }));

      expect(result.meta).toEqual({
        total: 25,
        page: 3,
        totalPages: 3,
        hasNextPage: false,
        hasPreviousPage: true,
      });
      expect(moviesRepository.findAndCount).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
        skip: 20,
        take: 10,
      });
    });

    it('computes pagination meta correctly for an empty result set', async () => {
      const { service, moviesRepository } = buildService();
      (moviesRepository.findAndCount as ReturnType<typeof vi.fn>).mockResolvedValue([
        [],
        0,
      ]);

      const result = await service.findAllPaginated(baseQuery());

      expect(result.data).toEqual([]);
      expect(result.meta).toEqual({
        total: 0,
        page: 1,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });

    it('maps a whitelisted sortBy to its column and honors the requested order', async () => {
      const { service, moviesRepository } = buildService();
      (moviesRepository.findAndCount as ReturnType<typeof vi.fn>).mockResolvedValue([
        [],
        0,
      ]);

      await service.findAllPaginated(baseQuery({ sortBy: 'releaseDate', order: 'asc' }));

      expect(moviesRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ order: { releaseDate: 'ASC' } }),
      );
    });

    it('falls back to sorting by createdAt instead of crashing or passing through an unwhitelisted sortBy', async () => {
      const { service, moviesRepository } = buildService();
      (moviesRepository.findAndCount as ReturnType<typeof vi.fn>).mockResolvedValue([
        [],
        0,
      ]);
      const query = baseQuery({
        sortBy: 'title; DROP TABLE movies;--' as ListMoviesQueryDto['sortBy'],
      });

      await service.findAllPaginated(query);

      expect(moviesRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ order: { createdAt: 'DESC' } }),
      );
    });
  });

  describe('findOneOrFail', () => {
    it('returns the movie when it exists', async () => {
      const { service, moviesRepository } = buildService();
      const movie = { id: 'movie-1' } as Movie;
      (moviesRepository.findOneBy as ReturnType<typeof vi.fn>).mockResolvedValue(movie);

      await expect(service.findOneOrFail('movie-1')).resolves.toBe(movie);
    });

    it('throws NotFoundException when the movie does not exist', async () => {
      const { service, moviesRepository } = buildService();
      (moviesRepository.findOneBy as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(service.findOneOrFail('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('applies a partial update and stamps updatedBy with the actor', async () => {
      const { service, moviesRepository } = buildService();
      const movie = { id: 'movie-1', title: 'Old Title', director: 'Old Director' } as Movie;
      (moviesRepository.findOneBy as ReturnType<typeof vi.fn>).mockResolvedValue(movie);

      const updated = await service.update('movie-1', { title: 'New Title' }, ACTOR_USER_ID);

      expect(updated.title).toBe('New Title');
      expect(updated.director).toBe('Old Director');
      expect(updated.updatedBy).toEqual({ id: ACTOR_USER_ID });
      expect(moviesRepository.save).toHaveBeenCalledWith(updated);
    });

    it('throws NotFoundException when the movie does not exist', async () => {
      const { service, moviesRepository } = buildService();
      (moviesRepository.findOneBy as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(
        service.update('missing', { title: 'X' }, ACTOR_USER_ID),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('soft-deletes an existing movie', async () => {
      const { service, moviesRepository } = buildService();
      (moviesRepository.findOneBy as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'movie-1',
      } as Movie);

      await service.remove('movie-1');

      expect(moviesRepository.softDelete).toHaveBeenCalledWith('movie-1');
    });

    it('throws NotFoundException when the movie does not exist', async () => {
      const { service, moviesRepository } = buildService();
      (moviesRepository.findOneBy as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
      expect(moviesRepository.softDelete).not.toHaveBeenCalled();
    });
  });

  describe('nested relations', () => {
    it('findCharacters returns a paginated page of the linked characters', async () => {
      const { service, moviesRepository, movieCharacterRepository } = buildService();
      (moviesRepository.findOneBy as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'movie-1',
      } as Movie);
      const character = { id: 'char-1', name: 'Luke Skywalker' };
      (movieCharacterRepository.findAndCount as ReturnType<typeof vi.fn>).mockResolvedValue([
        [{ movieId: 'movie-1', characterId: 'char-1', character }],
        1,
      ]);

      const result = await service.findCharacters('movie-1', baseRelatedQuery());

      expect(result.data).toEqual([character]);
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });
      expect(movieCharacterRepository.findAndCount).toHaveBeenCalledWith({
        where: { movieId: 'movie-1' },
        relations: { character: true },
        order: { character: { createdAt: 'DESC' } },
        skip: 0,
        take: 10,
      });
    });

    it('findPlanets returns a paginated page of the linked planets', async () => {
      const { service, moviesRepository, moviePlanetRepository } = buildService();
      (moviesRepository.findOneBy as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'movie-1',
      } as Movie);
      const planet = { id: 'planet-1', name: 'Tatooine' };
      (moviePlanetRepository.findAndCount as ReturnType<typeof vi.fn>).mockResolvedValue([
        [{ movieId: 'movie-1', planetId: 'planet-1', planet }],
        1,
      ]);

      const result = await service.findPlanets('movie-1', baseRelatedQuery());

      expect(result.data).toEqual([planet]);
    });

    it('findSpecies returns a paginated page of the linked species', async () => {
      const { service, moviesRepository, movieSpeciesRepository } = buildService();
      (moviesRepository.findOneBy as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'movie-1',
      } as Movie);
      const species = { id: 'species-1', name: 'Human' };
      (movieSpeciesRepository.findAndCount as ReturnType<typeof vi.fn>).mockResolvedValue([
        [{ movieId: 'movie-1', speciesId: 'species-1', species }],
        1,
      ]);

      const result = await service.findSpecies('movie-1', baseRelatedQuery());

      expect(result.data).toEqual([species]);
    });

    it('findStarships returns a paginated page of the linked starships', async () => {
      const { service, moviesRepository, movieStarshipRepository } = buildService();
      (moviesRepository.findOneBy as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'movie-1',
      } as Movie);
      const starship = { id: 'starship-1', name: 'X-wing' };
      (movieStarshipRepository.findAndCount as ReturnType<typeof vi.fn>).mockResolvedValue([
        [{ movieId: 'movie-1', starshipId: 'starship-1', starship }],
        1,
      ]);

      const result = await service.findStarships('movie-1', baseRelatedQuery());

      expect(result.data).toEqual([starship]);
    });

    it('findVehicles returns a paginated page of the linked vehicles', async () => {
      const { service, moviesRepository, movieVehicleRepository } = buildService();
      (moviesRepository.findOneBy as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'movie-1',
      } as Movie);
      const vehicle = { id: 'vehicle-1', name: 'Speeder' };
      (movieVehicleRepository.findAndCount as ReturnType<typeof vi.fn>).mockResolvedValue([
        [{ movieId: 'movie-1', vehicleId: 'vehicle-1', vehicle }],
        1,
      ]);

      const result = await service.findVehicles('movie-1', baseRelatedQuery());

      expect(result.data).toEqual([vehicle]);
    });

    it('computes pagination math on a middle page of a nested relation', async () => {
      const { service, moviesRepository, movieCharacterRepository } = buildService();
      (moviesRepository.findOneBy as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'movie-1',
      } as Movie);
      (movieCharacterRepository.findAndCount as ReturnType<typeof vi.fn>).mockResolvedValue([
        [{ movieId: 'movie-1', characterId: 'char-2', character: { id: 'char-2' } }],
        25,
      ]);

      const result = await service.findCharacters(
        'movie-1',
        baseRelatedQuery({ page: 2, limit: 10 }),
      );

      expect(result.meta).toEqual({
        total: 25,
        page: 2,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: true,
      });
      expect(movieCharacterRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 }),
      );
    });

    it('returns an empty page with zeroed meta when a movie has no linked characters', async () => {
      const { service, moviesRepository, movieCharacterRepository } = buildService();
      (moviesRepository.findOneBy as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'movie-1',
      } as Movie);
      (movieCharacterRepository.findAndCount as ReturnType<typeof vi.fn>).mockResolvedValue([
        [],
        0,
      ]);

      const result = await service.findCharacters('movie-1', baseRelatedQuery());

      expect(result.data).toEqual([]);
      expect(result.meta).toEqual({
        total: 0,
        page: 1,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });

    it('maps a whitelisted sortBy on a nested relation to its real column', async () => {
      const { service, moviesRepository, movieCharacterRepository } = buildService();
      (moviesRepository.findOneBy as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'movie-1',
      } as Movie);
      (movieCharacterRepository.findAndCount as ReturnType<typeof vi.fn>).mockResolvedValue([
        [],
        0,
      ]);

      await service.findCharacters(
        'movie-1',
        baseRelatedQuery({ sortBy: 'name', order: 'asc' }),
      );

      expect(movieCharacterRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ order: { character: { name: 'ASC' } } }),
      );
    });

    it('falls back to sorting by createdAt instead of crashing on an unwhitelisted sortBy', async () => {
      const { service, moviesRepository, movieCharacterRepository } = buildService();
      (moviesRepository.findOneBy as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'movie-1',
      } as Movie);
      (movieCharacterRepository.findAndCount as ReturnType<typeof vi.fn>).mockResolvedValue([
        [],
        0,
      ]);

      await service.findCharacters(
        'movie-1',
        baseRelatedQuery({
          sortBy: 'name; DROP TABLE characters;--' as ListRelatedQueryDto['sortBy'],
        }),
      );

      expect(movieCharacterRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ order: { character: { createdAt: 'DESC' } } }),
      );
    });

    it('throws NotFoundException from every nested relation lookup when the movie does not exist', async () => {
      const { service, moviesRepository } = buildService();
      (moviesRepository.findOneBy as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const query = baseRelatedQuery();
      await expect(service.findCharacters('missing', query)).rejects.toThrow(NotFoundException);
      await expect(service.findPlanets('missing', query)).rejects.toThrow(NotFoundException);
      await expect(service.findSpecies('missing', query)).rejects.toThrow(NotFoundException);
      await expect(service.findStarships('missing', query)).rejects.toThrow(NotFoundException);
      await expect(service.findVehicles('missing', query)).rejects.toThrow(NotFoundException);
    });
  });
});
