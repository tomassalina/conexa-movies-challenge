import type { SwapiCharacterDto } from '../dto/character.dto.js';
import { cleanString, extractSwapiIdOrNull, parseNullableInt } from '../utils/swapi-parsers.js';
import type { SwapiAdapter, SwapiRawItem } from './swapi-adapter.interface.js';

export interface RawPerson {
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

export class CharacterAdapter
  implements SwapiAdapter<SwapiRawItem<RawPerson>, SwapiCharacterDto>
{
  adapt({ uid, properties: p }: SwapiRawItem<RawPerson>): SwapiCharacterDto {
    return {
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
    };
  }
}
