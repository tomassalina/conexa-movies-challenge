export interface SwapiFilmDto {
  swapiId: string;
  title: string;
  episodeId: number | null;
  openingCrawl: string | null;
  director: string | null;
  producer: string | null;
  releaseDate: string | null;
  characterSwapiIds: string[];
  planetSwapiIds: string[];
  starshipSwapiIds: string[];
  vehicleSwapiIds: string[];
  speciesSwapiIds: string[];
}
