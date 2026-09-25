import type { SwapiStarshipDto } from '../dto/starship.dto.js';
import {
  cleanString,
  parseNullableInt,
  parseNullableNumericString,
} from '../utils/swapi-parsers.js';
import type { SwapiAdapter, SwapiRawItem } from './swapi-adapter.interface.js';

export interface RawStarship {
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

export class StarshipAdapter
  implements SwapiAdapter<SwapiRawItem<RawStarship>, SwapiStarshipDto>
{
  adapt({ uid, properties: s }: SwapiRawItem<RawStarship>): SwapiStarshipDto {
    return {
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
    };
  }
}
