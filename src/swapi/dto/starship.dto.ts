export interface SwapiStarshipDto {
  swapiId: string;
  name: string;
  model: string | null;
  manufacturer: string | null;
  costInCredits: string | null;
  length: string | null;
  maxAtmospheringSpeed: string | null;
  crew: string | null;
  passengers: string | null;
  cargoCapacity: string | null;
  consumables: string | null;
  hyperdriveRating: string | null;
  mglt: number | null;
  starshipClass: string | null;
}
