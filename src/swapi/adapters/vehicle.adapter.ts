import type { SwapiVehicleDto } from '../dto/vehicle.dto.js';
import {
  cleanString,
  parseNullableNumericString,
} from '../utils/swapi-parsers.js';
import type { SwapiAdapter, SwapiRawItem } from './swapi-adapter.interface.js';

export interface RawVehicle {
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
}

export class VehicleAdapter
  implements SwapiAdapter<SwapiRawItem<RawVehicle>, SwapiVehicleDto>
{
  adapt({ uid, properties: v }: SwapiRawItem<RawVehicle>): SwapiVehicleDto {
    return {
      swapiId: uid,
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
    };
  }
}
