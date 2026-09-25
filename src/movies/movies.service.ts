import { Injectable } from '@nestjs/common';
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

export interface MovieRelationIds {
  characterIds: string[];
  planetIds: string[];
  starshipIds: string[];
  vehicleIds: string[];
  speciesIds: string[];
}

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
}
