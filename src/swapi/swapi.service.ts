import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom, timeout } from 'rxjs';
import { CharacterAdapter, type RawPerson } from './adapters/character.adapter.js';
import { FilmAdapter, type RawFilm } from './adapters/film.adapter.js';
import { PlanetAdapter, type RawPlanet } from './adapters/planet.adapter.js';
import { SpeciesAdapter, type RawSpecies } from './adapters/species.adapter.js';
import { StarshipAdapter, type RawStarship } from './adapters/starship.adapter.js';
import type { SwapiRawItem } from './adapters/swapi-adapter.interface.js';
import { VehicleAdapter, type RawVehicle } from './adapters/vehicle.adapter.js';
import type { SwapiCharacterDto } from './dto/character.dto.js';
import type { SwapiFilmDto } from './dto/film.dto.js';
import type { SwapiPlanetDto } from './dto/planet.dto.js';
import type { SwapiSpeciesDto } from './dto/species.dto.js';
import type { SwapiStarshipDto } from './dto/starship.dto.js';
import type { SwapiVehicleDto } from './dto/vehicle.dto.js';

const SWAPI_BASE_URL = 'https://www.swapi.tech/api';
const REQUEST_TIMEOUT_MS = 5000;
/** Page size for list requests; swapi.tech accepts arbitrarily large `limit` values. */
const PAGE_LIMIT = 100;

interface SwapiListResponse<T> {
  message: string;
  total_records: number;
  total_pages: number;
  previous: string | null;
  next: string | null;
  results: SwapiRawItem<T>[];
}

/**
 * The `films` list endpoint is the one swapi.tech resource that does not
 * paginate: it always returns every film under a singular `result` array
 * (not `results`), with no `total_records`/`next`/`previous` fields at all.
 * Verified live against `GET /films?expanded=true`.
 */
interface SwapiFilmsListResponse<T> {
  message: string;
  result: SwapiRawItem<T>[];
}

@Injectable()
export class SwapiService {
  private readonly logger = new Logger(SwapiService.name);

  private readonly planetAdapter = new PlanetAdapter();
  private readonly characterAdapter = new CharacterAdapter();
  private readonly speciesAdapter = new SpeciesAdapter();
  private readonly starshipAdapter = new StarshipAdapter();
  private readonly vehicleAdapter = new VehicleAdapter();
  private readonly filmAdapter = new FilmAdapter();

  constructor(private readonly httpService: HttpService) {}

  async fetchPlanets(): Promise<SwapiPlanetDto[]> {
    const raw = await this.fetchAllPages<RawPlanet>('planets');
    return raw.map((item) => this.planetAdapter.adapt(item));
  }

  async fetchCharacters(): Promise<SwapiCharacterDto[]> {
    const raw = await this.fetchAllPages<RawPerson>('people');
    return raw.map((item) => this.characterAdapter.adapt(item));
  }

  async fetchSpecies(): Promise<SwapiSpeciesDto[]> {
    const raw = await this.fetchAllPages<RawSpecies>('species');
    return raw.map((item) => this.speciesAdapter.adapt(item));
  }

  async fetchStarships(): Promise<SwapiStarshipDto[]> {
    const raw = await this.fetchAllPages<RawStarship>('starships');
    return raw.map((item) => this.starshipAdapter.adapt(item));
  }

  async fetchVehicles(): Promise<SwapiVehicleDto[]> {
    const raw = await this.fetchAllPages<RawVehicle>('vehicles');
    return raw.map((item) => this.vehicleAdapter.adapt(item));
  }

  async fetchFilms(): Promise<SwapiFilmDto[]> {
    const raw = await this.fetchFilmsList<RawFilm>();
    return raw.map((item) => this.filmAdapter.adapt(item));
  }

  /**
   * Fetches every page of a swapi.tech list resource, requesting `expanded=true`
   * on the first page (swapi.tech's `next` links already preserve it for later
   * pages), and returns each item's raw `{ uid, properties }` shape for the
   * caller's adapter to map.
   */
  private async fetchAllPages<T>(resource: string): Promise<Array<SwapiRawItem<T>>> {
    const results: Array<SwapiRawItem<T>> = [];
    let nextUrl: string | null =
      `${SWAPI_BASE_URL}/${resource}?page=1&limit=${PAGE_LIMIT}&expanded=true`;
    while (nextUrl) {
      const page: SwapiListResponse<T> = await this.get<SwapiListResponse<T>>(nextUrl);
      results.push(...page.results);
      nextUrl = page.next;
    }
    return results;
  }

  /**
   * `films` is unpaginated on swapi.tech (see `SwapiFilmsListResponse`), so it
   * needs a single request rather than `fetchAllPages`'s `next`-following loop.
   */
  private async fetchFilmsList<T>(): Promise<Array<SwapiRawItem<T>>> {
    const page = await this.get<SwapiFilmsListResponse<T>>(
      `${SWAPI_BASE_URL}/films?expanded=true`,
    );
    return page.result;
  }

  private async get<T>(url: string): Promise<T> {
    const response = await firstValueFrom(
      this.httpService.get<T>(url).pipe(
        timeout(REQUEST_TIMEOUT_MS),
        catchError((error: unknown) => {
          this.logger.error(`SWAPI request failed for ${url}`, error as Error);
          throw new ServiceUnavailableException('Star Wars API is currently unavailable');
        }),
      ),
    );
    return response.data;
  }
}
