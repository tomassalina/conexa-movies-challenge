import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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

export interface MovieRelationIds {
  characterIds: string[];
  planetIds: string[];
  starshipIds: string[];
  vehicleIds: string[];
  speciesIds: string[];
}

export interface PaginationMeta {
  total: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
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

  async findCharacters(movieId: string): Promise<Character[]> {
    await this.findOneOrFail(movieId);
    const links = await this.movieCharacterRepository.find({
      where: { movieId },
      relations: { character: true },
    });
    return links.map((link) => link.character);
  }

  async findPlanets(movieId: string): Promise<Planet[]> {
    await this.findOneOrFail(movieId);
    const links = await this.moviePlanetRepository.find({
      where: { movieId },
      relations: { planet: true },
    });
    return links.map((link) => link.planet);
  }

  async findSpecies(movieId: string): Promise<Species[]> {
    await this.findOneOrFail(movieId);
    const links = await this.movieSpeciesRepository.find({
      where: { movieId },
      relations: { species: true },
    });
    return links.map((link) => link.species);
  }

  async findStarships(movieId: string): Promise<Starship[]> {
    await this.findOneOrFail(movieId);
    const links = await this.movieStarshipRepository.find({
      where: { movieId },
      relations: { starship: true },
    });
    return links.map((link) => link.starship);
  }

  async findVehicles(movieId: string): Promise<Vehicle[]> {
    await this.findOneOrFail(movieId);
    const links = await this.movieVehicleRepository.find({
      where: { movieId },
      relations: { vehicle: true },
    });
    return links.map((link) => link.vehicle);
  }
}
