export interface SwapiVehicleDto {
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
  vehicleClass: string | null;
}
