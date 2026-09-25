import { Injectable, Logger } from '@nestjs/common';
import { CharactersService } from '../characters/characters.service.js';
import { MoviesService } from '../movies/movies.service.js';
import { PlanetsService } from '../planets/planets.service.js';
import { SpeciesService } from '../species/species.service.js';
import { StarshipsService } from '../starships/starships.service.js';
import { VehiclesService } from '../vehicles/vehicles.service.js';
import { SwapiService } from './swapi.service.js';

@Injectable()
export class SwapiSyncService {
  private readonly logger = new Logger(SwapiSyncService.name);

  constructor(
    private readonly swapiService: SwapiService,
    private readonly planetsService: PlanetsService,
    private readonly charactersService: CharactersService,
    private readonly speciesService: SpeciesService,
    private readonly starshipsService: StarshipsService,
    private readonly vehiclesService: VehiclesService,
    private readonly moviesService: MoviesService,
  ) {}

  async syncPlanets(actorUserId: string): Promise<number> {
    const planets = await this.swapiService.fetchPlanets();
    for (const planet of planets) {
      await this.planetsService.upsertFromSwapi(planet, actorUserId);
    }
    this.logger.log(`Synced ${planets.length} planets`);
    return planets.length;
  }

  async syncCharacters(actorUserId: string): Promise<number> {
    const characters = await this.swapiService.fetchCharacters();
    for (const character of characters) {
      const planet = character.homeworldSwapiId
        ? await this.planetsService.findBySwapiId(character.homeworldSwapiId)
        : null;
      await this.charactersService.upsertFromSwapi(character, actorUserId, planet?.id ?? null);
    }
    this.logger.log(`Synced ${characters.length} characters`);
    return characters.length;
  }

  async syncSpecies(actorUserId: string): Promise<number> {
    const species = await this.swapiService.fetchSpecies();
    for (const item of species) {
      const planet = item.homeworldSwapiId
        ? await this.planetsService.findBySwapiId(item.homeworldSwapiId)
        : null;
      await this.speciesService.upsertFromSwapi(item, actorUserId, planet?.id ?? null);
    }
    this.logger.log(`Synced ${species.length} species`);
    return species.length;
  }

  async syncStarships(actorUserId: string): Promise<number> {
    const starships = await this.swapiService.fetchStarships();
    for (const starship of starships) {
      await this.starshipsService.upsertFromSwapi(starship, actorUserId);
    }
    this.logger.log(`Synced ${starships.length} starships`);
    return starships.length;
  }

  async syncVehicles(actorUserId: string): Promise<number> {
    const vehicles = await this.swapiService.fetchVehicles();
    for (const vehicle of vehicles) {
      await this.vehiclesService.upsertFromSwapi(vehicle, actorUserId);
    }
    this.logger.log(`Synced ${vehicles.length} vehicles`);
    return vehicles.length;
  }

  /** Planets first (FK dependency), then the 4 leaf catalogs in parallel — none of them depend on each other, only on planets. */
  async syncCatalog(actorUserId: string): Promise<void> {
    await this.syncPlanets(actorUserId);
    await Promise.all([
      this.syncCharacters(actorUserId),
      this.syncSpecies(actorUserId),
      this.syncStarships(actorUserId),
      this.syncVehicles(actorUserId),
    ]);
  }

  /** Requires the catalog to already be synced — resolves each film's related SWAPI ids to our local uuids. */
  async syncMovies(actorUserId: string): Promise<number> {
    const films = await this.swapiService.fetchFilms();
    for (const film of films) {
      const movie = await this.moviesService.upsertFromSwapi(film, actorUserId);

      const [characterIds, planetIds, starshipIds, vehicleIds, speciesIds] =
        await Promise.all([
          this.resolveIds(film.characterSwapiIds, (id) =>
            this.charactersService.findBySwapiId(id),
          ),
          this.resolveIds(film.planetSwapiIds, (id) => this.planetsService.findBySwapiId(id)),
          this.resolveIds(film.starshipSwapiIds, (id) =>
            this.starshipsService.findBySwapiId(id),
          ),
          this.resolveIds(film.vehicleSwapiIds, (id) => this.vehiclesService.findBySwapiId(id)),
          this.resolveIds(film.speciesSwapiIds, (id) => this.speciesService.findBySwapiId(id)),
        ]);

      await this.moviesService.linkRelations(
        movie.id,
        { characterIds, planetIds, starshipIds, vehicleIds, speciesIds },
        actorUserId,
      );
    }
    this.logger.log(`Synced ${films.length} movies`);
    return films.length;
  }

  async syncAll(actorUserId: string): Promise<void> {
    await this.syncCatalog(actorUserId);
    await this.syncMovies(actorUserId);
  }

  private async resolveIds<T extends { id: string }>(
    swapiIds: string[],
    findBySwapiId: (id: string) => Promise<T | null>,
  ): Promise<string[]> {
    const found = await Promise.all(swapiIds.map((id) => findBySwapiId(id)));
    const ids: string[] = [];
    for (const entity of found) {
      if (entity !== null) {
        ids.push(entity.id);
      }
    }
    return ids;
  }
}
