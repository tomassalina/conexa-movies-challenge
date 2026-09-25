import type { SwapiSpeciesDto } from '../dto/species.dto.js';
import {
  cleanString,
  extractSwapiIdOrNull,
  parseNullableInt,
  parseNullableNumericString,
} from '../utils/swapi-parsers.js';
import type { SwapiAdapter, SwapiRawItem } from './swapi-adapter.interface.js';

export interface RawSpecies {
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

export class SpeciesAdapter
  implements SwapiAdapter<SwapiRawItem<RawSpecies>, SwapiSpeciesDto>
{
  adapt({ uid, properties: s }: SwapiRawItem<RawSpecies>): SwapiSpeciesDto {
    return {
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
    };
  }
}
