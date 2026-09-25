import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type {
  FindOptionsOrder,
  FindOptionsRelations,
  FindOptionsWhere,
  ObjectLiteral,
} from 'typeorm';
import { Repository } from 'typeorm';
import type { SwapiFilmDto } from '../swapi/dto/film.dto.js';
import { Movie } from './entities/movie.entity.js';
import { MovieCharacter } from './entities/movie-character.entity.js';
import { MoviePlanet } from './entities/movie-planet.entity.js';
import { MovieSpecies } from './entities/movie-species.entity.js';
import { MovieStarship } from './entities/movie-starship.entity.js';
import { MovieVehicle } from './entities/movie-vehicle.entity.js';
import { User } from '../users/entities/user.entity.js';
import { Character } from '../characters/entities/character.entity.js';
import { Planet } from '../planets/entities/planet.entity.js';
import { Species } from '../species/entities/species.entity.js';
import { Starship } from '../starships/entities/starship.entity.js';
import { Vehicle } from '../vehicles/entities/vehicle.entity.js';
import type { CreateMovieDto } from './dto/create-movie.dto.js';
import type { UpdateMovieDto } from './dto/update-movie.dto.js';
import type { ListMoviesQueryDto, MovieSortField } from './dto/list-movies-query.dto.js';
import type {
  ListRelatedQueryDto,
  RelatedResourceSortField,
} from './dto/list-related-query.dto.js';
import type { PaginatedResult } from '../common/pagination/paginated-result.interface.js';

export interface MovieRelationIds {
  characterIds: string[];
  planetIds: string[];
  starshipIds: string[];
  vehicleIds: string[];
  speciesIds: string[];
}

/**
 * Whitelist mapping every allowed `sortBy` value to its real column name.
 * This is the only place a `sortBy` string is allowed to influence a TypeORM
 * `order` clause — never interpolate the raw query value directly, even
 * though `ListMoviesQueryDto` is already validated by the Zod enum upstream.
 * Keeping the guard here too means the service stays safe even if it's ever
 * called from somewhere other than the HTTP layer.
 */
const SORT_COLUMNS: Record<MovieSortField, keyof Movie> = {
  title: 'title',
  releaseDate: 'releaseDate',
  episodeId: 'episodeId',
  createdAt: 'createdAt',
};
const DEFAULT_SORT_FIELD: MovieSortField = 'createdAt';

/**
 * Same whitelist pattern as `SORT_COLUMNS` above, for the 5 nested relation
 * routes. `name` and `createdAt` exist on every related entity, so one map
 * covers characters/planets/species/starships/vehicles.
 */
const RELATED_SORT_COLUMNS: Record<RelatedResourceSortField, string> = {
  name: 'name',
  createdAt: 'createdAt',
};
const DEFAULT_RELATED_SORT_FIELD: RelatedResourceSortField = 'createdAt';

@Injectable()
export class MoviesService {
  constructor(
    @InjectRepository(Movie)
    private readonly moviesRepository: Repository<Movie>,
    @InjectRepository(MoviePlanet)
    private readonly moviePlanetRepository: Repository<MoviePlanet>,
    @InjectRepository(MovieCharacter)
    private readonly movieCharacterRepository: Repository<MovieCharacter>,
    @InjectRepository(MovieSpecies)
    private readonly movieSpeciesRepository: Repository<MovieSpecies>,
    @InjectRepository(MovieStarship)
    private readonly movieStarshipRepository: Repository<MovieStarship>,
    @InjectRepository(MovieVehicle)
    private readonly movieVehicleRepository: Repository<MovieVehicle>,
  ) {}

  findBySwapiId(swapiId: string): Promise<Movie | null> {
    return this.moviesRepository.findOneBy({ swapiId });
  }

  async upsertFromSwapi(dto: SwapiFilmDto, actorUserId: string): Promise<Movie> {
    const actor = { id: actorUserId } as User;
    await this.moviesRepository.upsert(
      {
        swapiId: dto.swapiId,
        title: dto.title,
        episodeId: dto.episodeId,
        openingCrawl: dto.openingCrawl,
        director: dto.director,
        producer: dto.producer,
        releaseDate: dto.releaseDate,
        createdBy: actor,
        updatedBy: actor,
      },
      { conflictPaths: ['swapiId'] },
    );
    const saved = await this.findBySwapiId(dto.swapiId);
    if (!saved) {
      throw new Error(`Movie ${dto.swapiId} was upserted but cannot be found`);
    }
    return saved;
  }

  async linkRelations(
    movieId: string,
    ids: MovieRelationIds,
    actorUserId: string,
  ): Promise<void> {
    const actor = { id: actorUserId } as User;
    const createdBy = actor;

    if (ids.planetIds.length > 0) {
      await this.moviePlanetRepository.upsert(
        ids.planetIds.map((planetId) => ({ movieId, planetId, createdBy })),
        { conflictPaths: ['movieId', 'planetId'] },
      );
    }
    if (ids.characterIds.length > 0) {
      await this.movieCharacterRepository.upsert(
        ids.characterIds.map((characterId) => ({ movieId, characterId, createdBy })),
        { conflictPaths: ['movieId', 'characterId'] },
      );
    }
    if (ids.speciesIds.length > 0) {
      await this.movieSpeciesRepository.upsert(
        ids.speciesIds.map((speciesId) => ({ movieId, speciesId, createdBy })),
        { conflictPaths: ['movieId', 'speciesId'] },
      );
    }
    if (ids.starshipIds.length > 0) {
      await this.movieStarshipRepository.upsert(
        ids.starshipIds.map((starshipId) => ({ movieId, starshipId, createdBy })),
        { conflictPaths: ['movieId', 'starshipId'] },
      );
    }
    if (ids.vehicleIds.length > 0) {
      await this.movieVehicleRepository.upsert(
        ids.vehicleIds.map((vehicleId) => ({ movieId, vehicleId, createdBy })),
        { conflictPaths: ['movieId', 'vehicleId'] },
      );
    }
  }

  /**
   * Creates a manually authored movie. `swapiId` is always `null` here —
   * only the SWAPI sync path (`upsertFromSwapi`) may set it.
   */
  async create(dto: CreateMovieDto, actorUserId: string): Promise<Movie> {
    const actor = { id: actorUserId } as User;
    const movie = this.moviesRepository.create({
      ...dto,
      swapiId: null,
      createdBy: actor,
      updatedBy: actor,
    });
    return this.moviesRepository.save(movie);
  }

  async findAllPaginated(query: ListMoviesQueryDto): Promise<PaginatedResult<Movie>> {
    const { page, limit, sortBy, order } = query;
    const sortColumn = SORT_COLUMNS[sortBy] ?? SORT_COLUMNS[DEFAULT_SORT_FIELD];

    const [data, total] = await this.moviesRepository.findAndCount({
      order: { [sortColumn]: order.toUpperCase() as 'ASC' | 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOneOrFail(id: string): Promise<Movie> {
    const movie = await this.moviesRepository.findOneBy({ id });
    if (!movie) {
      throw new NotFoundException(`Movie ${id} not found`);
    }
    return movie;
  }

  async update(id: string, dto: UpdateMovieDto, actorUserId: string): Promise<Movie> {
    const movie = await this.findOneOrFail(id);
    Object.assign(movie, dto);
    movie.updatedBy = { id: actorUserId } as User;
    return this.moviesRepository.save(movie);
  }

  /**
   * Soft-deletes the movie (sets `deletedAt` via the entity's
   * `@DeleteDateColumn`). Standard TypeORM finders automatically exclude
   * soft-deleted rows, so the movie disappears from listing/detail/nested
   * relation endpoints immediately while its history is preserved.
   */
  async remove(id: string): Promise<void> {
    await this.findOneOrFail(id);
    await this.moviesRepository.softDelete(id);
  }

  async findCharacters(
    movieId: string,
    query: ListRelatedQueryDto,
  ): Promise<PaginatedResult<Character>> {
    await this.findOneOrFail(movieId);
    return this.findRelatedPaginated<MovieCharacter, Character>(
      this.movieCharacterRepository,
      movieId,
      'character',
      query,
    );
  }

  async findPlanets(
    movieId: string,
    query: ListRelatedQueryDto,
  ): Promise<PaginatedResult<Planet>> {
    await this.findOneOrFail(movieId);
    return this.findRelatedPaginated<MoviePlanet, Planet>(
      this.moviePlanetRepository,
      movieId,
      'planet',
      query,
    );
  }

  async findSpecies(
    movieId: string,
    query: ListRelatedQueryDto,
  ): Promise<PaginatedResult<Species>> {
    await this.findOneOrFail(movieId);
    return this.findRelatedPaginated<MovieSpecies, Species>(
      this.movieSpeciesRepository,
      movieId,
      'species',
      query,
    );
  }

  async findStarships(
    movieId: string,
    query: ListRelatedQueryDto,
  ): Promise<PaginatedResult<Starship>> {
    await this.findOneOrFail(movieId);
    return this.findRelatedPaginated<MovieStarship, Starship>(
      this.movieStarshipRepository,
      movieId,
      'starship',
      query,
    );
  }

  async findVehicles(
    movieId: string,
    query: ListRelatedQueryDto,
  ): Promise<PaginatedResult<Vehicle>> {
    await this.findOneOrFail(movieId);
    return this.findRelatedPaginated<MovieVehicle, Vehicle>(
      this.movieVehicleRepository,
      movieId,
      'vehicle',
      query,
    );
  }

  /**
   * Shared pagination for every movie-to-X junction table. Mirrors
   * `findAllPaginated`'s `findAndCount` pattern so both response shapes stay
   * identical; only the join-table repository and the relation property name
   * (e.g. `'character'`) differ per call site.
   */
  private async findRelatedPaginated<TLink extends ObjectLiteral, TEntity>(
    repository: Repository<TLink>,
    movieId: string,
    relationProperty: string,
    query: ListRelatedQueryDto,
  ): Promise<PaginatedResult<TEntity>> {
    const { page, limit, sortBy, order } = query;
    const sortColumn = RELATED_SORT_COLUMNS[sortBy] ?? RELATED_SORT_COLUMNS[DEFAULT_RELATED_SORT_FIELD];

    const [links, total] = await repository.findAndCount({
      where: { movieId } as unknown as FindOptionsWhere<TLink>,
      relations: { [relationProperty]: true } as FindOptionsRelations<TLink>,
      order: { [relationProperty]: { [sortColumn]: order.toUpperCase() } } as FindOptionsOrder<TLink>,
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: links.map((link) => (link as Record<string, unknown>)[relationProperty] as TEntity),
      meta: {
        total,
        page,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }
}
