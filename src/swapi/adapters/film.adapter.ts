import type { SwapiFilmDto } from '../dto/film.dto.js';
import { cleanString, extractSwapiId } from '../utils/swapi-parsers.js';
import type { SwapiAdapter, SwapiRawItem } from './swapi-adapter.interface.js';

export interface RawFilm {
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

export class FilmAdapter implements SwapiAdapter<SwapiRawItem<RawFilm>, SwapiFilmDto> {
  adapt({ uid, properties: f }: SwapiRawItem<RawFilm>): SwapiFilmDto {
    return {
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
    };
  }
}
