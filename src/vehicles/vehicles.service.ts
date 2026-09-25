import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { SwapiVehicleDto } from '../swapi/dto/vehicle.dto.js';
import { Vehicle } from './entities/vehicle.entity.js';
import { User } from '../users/entities/user.entity.js';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehiclesRepository: Repository<Vehicle>,
  ) {}

  findBySwapiId(swapiId: string): Promise<Vehicle | null> {
    return this.vehiclesRepository.findOneBy({ swapiId });
  }

  async upsertFromSwapi(dto: SwapiVehicleDto, actorUserId: string): Promise<Vehicle> {
    const actor = { id: actorUserId } as User;
    await this.vehiclesRepository.upsert(
      {
        swapiId: dto.swapiId,
        name: dto.name,
        model: dto.model,
        manufacturer: dto.manufacturer,
        costInCredits: dto.costInCredits,
        length: dto.length,
        maxAtmospheringSpeed: dto.maxAtmospheringSpeed,
        crew: dto.crew,
        passengers: dto.passengers,
        cargoCapacity: dto.cargoCapacity,
        consumables: dto.consumables,
        vehicleClass: dto.vehicleClass,
        createdBy: actor,
        updatedBy: actor,
      },
      { conflictPaths: ['swapiId'] },
    );
    const saved = await this.findBySwapiId(dto.swapiId);
    if (!saved) {
      throw new Error(`Vehicle ${dto.swapiId} was upserted but cannot be found`);
    }
    return saved;
  }
}
