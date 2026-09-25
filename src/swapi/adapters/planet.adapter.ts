import type { SwapiPlanetDto } from '../dto/planet.dto.js';
import {
  cleanString,
  parseNullableInt,
  parseNullableNumericString,
} from '../utils/swapi-parsers.js';
import type { SwapiAdapter, SwapiRawItem } from './swapi-adapter.interface.js';

export interface RawPlanet {
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

export class PlanetAdapter implements SwapiAdapter<SwapiRawItem<RawPlanet>, SwapiPlanetDto> {
  adapt({ uid, properties: p }: SwapiRawItem<RawPlanet>): SwapiPlanetDto {
    return {
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
    };
  }
}
