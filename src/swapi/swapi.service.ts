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

const SWAPI_BASE_URL = 'https://swapi.dev/api';
const REQUEST_TIMEOUT_MS = 5000;

interface SwapiListResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
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
  url: string;
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
  url: string;
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
  url: string;
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
  url: string;
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
  url: string;
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
  url: string;
}

@Injectable()
export class SwapiService {
  private readonly logger = new Logger(SwapiService.name);

  constructor(private readonly httpService: HttpService) {}

  async fetchPlanets(): Promise<SwapiPlanetDto[]> {
    const raw = await this.fetchAllPages<RawPlanet>(`${SWAPI_BASE_URL}/planets/`);
    return raw.map((p) => ({
      swapiId: extractSwapiId(p.url),
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
    const raw = await this.fetchAllPages<RawPerson>(`${SWAPI_BASE_URL}/people/`);
    return raw.map((p) => ({
      swapiId: extractSwapiId(p.url),
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
    const raw = await this.fetchAllPages<RawSpecies>(`${SWAPI_BASE_URL}/species/`);
    return raw.map((s) => ({
      swapiId: extractSwapiId(s.url),
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
    const raw = await this.fetchAllPages<RawStarship>(`${SWAPI_BASE_URL}/starships/`);
    return raw.map((s) => ({
      swapiId: extractSwapiId(s.url),
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
    const raw = await this.fetchAllPages<RawVehicle>(`${SWAPI_BASE_URL}/vehicles/`);
    return raw.map((v) => ({
      swapiId: extractSwapiId(v.url),
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
    const raw = await this.fetchAllPages<RawFilm>(`${SWAPI_BASE_URL}/films/`);
    return raw.map((f) => ({
      swapiId: extractSwapiId(f.url),
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

  private async fetchAllPages<T>(url: string): Promise<T[]> {
    const results: T[] = [];
    let nextUrl: string | null = url;
    while (nextUrl) {
      const page: SwapiListResponse<T> = await this.get<SwapiListResponse<T>>(nextUrl);
      results.push(...page.results);
      nextUrl = page.next;
    }
    return results;
  }

  private async get<T>(url: string): Promise<T> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<T>(url).pipe(
          timeout(REQUEST_TIMEOUT_MS),
          catchError((error: unknown) => {
            this.logger.error(`SWAPI request failed for ${url}`, error as Error);
            throw new ServiceUnavailableException(
              'Star Wars API is currently unavailable',
            );
          }),
        ),
      );
      return response.data;
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }
      this.logger.error(`Unexpected SWAPI error for ${url}`, error as Error);
      throw new ServiceUnavailableException('Star Wars API is currently unavailable');
    }
  }
}
