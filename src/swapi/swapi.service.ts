import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom, timeout } from 'rxjs';
import type { SwapiCharacterDto } from './dto/character.dto.js';
import type { SwapiFilmDto } from './dto/film.dto.js';
import type { SwapiPlanetDto } from './dto/planet.dto.js';
import type { SwapiSpeciesDto } from './dto/species.dto.js';
import type { SwapiStarshipDto } from './dto/starship.dto.js';
import type { SwapiVehicleDto } from './dto/vehicle.dto.js';
import {
  cleanString,
  extractSwapiId,
  extractSwapiIdOrNull,
  parseNullableInt,
  parseNullableNumericString,
} from './utils/swapi-parsers.js';

const SWAPI_BASE_URL = 'https://www.swapi.tech/api';
const REQUEST_TIMEOUT_MS = 5000;
/** Page size for list requests; swapi.tech accepts arbitrarily large `limit` values. */
const PAGE_LIMIT = 100;

/** A single item inside a swapi.tech list `results` array (with `?expanded=true`). */
interface SwapiListItem<T> {
  properties: T;
  _id: string;
  description: string;
  uid: string;
  __v: number;
}

interface SwapiListResponse<T> {
  message: string;
  total_records: number;
  total_pages: number;
  previous: string | null;
  next: string | null;
  results: SwapiListItem<T>[];
}

/**
 * The `films` list endpoint is the one swapi.tech resource that does not
 * paginate: it always returns every film under a singular `result` array
 * (not `results`), with no `total_records`/`next`/`previous` fields at all.
 * Verified live against `GET /films?expanded=true`.
 */
interface SwapiFilmsListResponse<T> {
  message: string;
  result: SwapiListItem<T>[];
}

interface RawPlanet {
  name: string;
  rotation_period: string;
  orbital_period: string;
  diameter: string;
  climate: string;
  gravity: string;
  terrain: string;
  surface_water: string;
  population: string;
}

interface RawPerson {
  name: string;
  height: string;
  mass: string;
  hair_color: string;
  skin_color: string;
  eye_color: string;
  birth_year: string;
  gender: string;
  homeworld: string;
}

interface RawSpecies {
  name: string;
  classification: string;
  designation: string;
  average_height: string;
  skin_colors: string;
  hair_colors: string;
  eye_colors: string;
  average_lifespan: string;
  homeworld: string | null;
  language: string;
}

interface RawStarship {
  name: string;
  model: string;
  manufacturer: string;
  cost_in_credits: string;
  length: string;
  max_atmosphering_speed: string;
  crew: string;
  passengers: string;
  cargo_capacity: string;
  consumables: string;
  hyperdrive_rating: string;
  MGLT: string;
  starship_class: string;
}

interface RawVehicle {
  name: string;
  model: string;
  manufacturer: string;
  cost_in_credits: string;
  length: string;
  max_atmosphering_speed: string;
  crew: string;
  passengers: string;
  cargo_capacity: string;
  consumables: string;
  vehicle_class: string;
}

interface RawFilm {
  title: string;
  episode_id: number;
  opening_crawl: string;
  director: string;
  producer: string;
  release_date: string;
  characters: string[];
  planets: string[];
  starships: string[];
  vehicles: string[];
  species: string[];
}

@Injectable()
export class SwapiService {
  private readonly logger = new Logger(SwapiService.name);

  constructor(private readonly httpService: HttpService) {}

  async fetchPlanets(): Promise<SwapiPlanetDto[]> {
    const raw = await this.fetchAllPages<RawPlanet>('planets');
    return raw.map(({ uid, properties: p }) => ({
      swapiId: uid,
      name: p.name,
      rotationPeriod: parseNullableInt(p.rotation_period),
      orbitalPeriod: parseNullableInt(p.orbital_period),
      diameter: parseNullableInt(p.diameter),
      climate: cleanString(p.climate),
      gravity: cleanString(p.gravity),
      terrain: cleanString(p.terrain),
      surfaceWater: parseNullableInt(p.surface_water),
      population: parseNullableNumericString(p.population),
    }));
  }

  async fetchCharacters(): Promise<SwapiCharacterDto[]> {
    const raw = await this.fetchAllPages<RawPerson>('people');
    return raw.map(({ uid, properties: p }) => ({
      swapiId: uid,
      name: p.name,
      height: parseNullableInt(p.height),
      mass: parseNullableInt(p.mass),
      hairColor: cleanString(p.hair_color),
      skinColor: cleanString(p.skin_color),
      eyeColor: cleanString(p.eye_color),
      birthYear: cleanString(p.birth_year),
      gender: cleanString(p.gender),
      homeworldSwapiId: extractSwapiIdOrNull(p.homeworld),
    }));
  }

  async fetchSpecies(): Promise<SwapiSpeciesDto[]> {
    const raw = await this.fetchAllPages<RawSpecies>('species');
    return raw.map(({ uid, properties: s }) => ({
      swapiId: uid,
      name: s.name,
      classification: cleanString(s.classification),
      designation: cleanString(s.designation),
      averageHeight: parseNullableNumericString(s.average_height),
      skinColors: cleanString(s.skin_colors),
      hairColors: cleanString(s.hair_colors),
      eyeColors: cleanString(s.eye_colors),
      averageLifespan: parseNullableInt(s.average_lifespan),
      language: cleanString(s.language),
      homeworldSwapiId: extractSwapiIdOrNull(s.homeworld),
    }));
  }

  async fetchStarships(): Promise<SwapiStarshipDto[]> {
    const raw = await this.fetchAllPages<RawStarship>('starships');
    return raw.map(({ uid, properties: s }) => ({
      swapiId: uid,
      name: s.name,
      model: cleanString(s.model),
      manufacturer: cleanString(s.manufacturer),
      costInCredits: parseNullableNumericString(s.cost_in_credits),
      length: parseNullableNumericString(s.length),
      maxAtmospheringSpeed: cleanString(s.max_atmosphering_speed),
      crew: cleanString(s.crew),
      passengers: cleanString(s.passengers),
      cargoCapacity: parseNullableNumericString(s.cargo_capacity),
      consumables: cleanString(s.consumables),
      hyperdriveRating: parseNullableNumericString(s.hyperdrive_rating),
      mglt: parseNullableInt(s.MGLT),
      starshipClass: cleanString(s.starship_class),
    }));
  }

  async fetchVehicles(): Promise<SwapiVehicleDto[]> {
    const raw = await this.fetchAllPages<RawVehicle>('vehicles');
    return raw.map(({ uid, properties: v }) => ({
      swapiId: uid,
      name: v.name,
      model: cleanString(v.model),
      manufacturer: cleanString(v.manufacturer),
      costInCredits: parseNullableNumericString(v.cost_in_credits),
      length: parseNullableNumericString(v.length),
      maxAtmospheringSpeed: cleanString(v.max_atmosphering_speed),
      crew: cleanString(v.crew),
      passengers: cleanString(v.passengers),
      cargoCapacity: parseNullableNumericString(v.cargo_capacity),
      consumables: cleanString(v.consumables),
      vehicleClass: cleanString(v.vehicle_class),
    }));
  }

  async fetchFilms(): Promise<SwapiFilmDto[]> {
    const raw = await this.fetchFilmsList<RawFilm>();
    return raw.map(({ uid, properties: f }) => ({
      swapiId: uid,
      title: f.title,
      episodeId: f.episode_id ?? null,
      openingCrawl: cleanString(f.opening_crawl),
      director: cleanString(f.director),
      producer: cleanString(f.producer),
      releaseDate: cleanString(f.release_date),
      characterSwapiIds: f.characters.map((u) => extractSwapiId(u)),
      planetSwapiIds: f.planets.map((u) => extractSwapiId(u)),
      starshipSwapiIds: f.starships.map((u) => extractSwapiId(u)),
      vehicleSwapiIds: f.vehicles.map((u) => extractSwapiId(u)),
      speciesSwapiIds: f.species.map((u) => extractSwapiId(u)),
    }));
  }

  /**
   * Fetches every page of a swapi.tech list resource, requesting `expanded=true`
   * on the first page (swapi.tech's `next` links already preserve it for later
   * pages), and returns each item's `uid` alongside its unwrapped `properties`.
   */
  private async fetchAllPages<T>(
    resource: string,
  ): Promise<Array<{ uid: string; properties: T }>> {
    const results: Array<{ uid: string; properties: T }> = [];
    let nextUrl: string | null =
      `${SWAPI_BASE_URL}/${resource}?page=1&limit=${PAGE_LIMIT}&expanded=true`;
    while (nextUrl) {
      const page: SwapiListResponse<T> = await this.get<SwapiListResponse<T>>(nextUrl);
      for (const item of page.results) {
        results.push({ uid: item.uid, properties: item.properties });
      }
      nextUrl = page.next;
    }
    return results;
  }

  /**
   * `films` is unpaginated on swapi.tech (see `SwapiFilmsListResponse`), so it
   * needs a single request rather than `fetchAllPages`'s `next`-following loop.
   */
  private async fetchFilmsList<T>(): Promise<Array<{ uid: string; properties: T }>> {
    const page = await this.get<SwapiFilmsListResponse<T>>(
      `${SWAPI_BASE_URL}/films?expanded=true`,
    );
    return page.result.map((item) => ({ uid: item.uid, properties: item.properties }));
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
