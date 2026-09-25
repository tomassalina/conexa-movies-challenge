export interface SwapiPlanetDto {
  swapiId: string;
  name: string;
  rotationPeriod: number | null;
  orbitalPeriod: number | null;
  diameter: number | null;
  climate: string | null;
  gravity: string | null;
  terrain: string | null;
  surfaceWater: number | null;
  population: string | null;
}
