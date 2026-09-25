import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { SwapiPlanetDto } from '../swapi/dto/planet.dto.js';
import { Planet } from './entities/planet.entity.js';
import { User } from '../users/entities/user.entity.js';

@Injectable()
export class PlanetsService {
  constructor(
    @InjectRepository(Planet)
    private readonly planetsRepository: Repository<Planet>,
  ) {}

  findBySwapiId(swapiId: string): Promise<Planet | null> {
    return this.planetsRepository.findOneBy({ swapiId });
  }

  async upsertFromSwapi(dto: SwapiPlanetDto, actorUserId: string): Promise<Planet> {
    const actor = { id: actorUserId } as User;
    await this.planetsRepository.upsert(
      {
        swapiId: dto.swapiId,
        name: dto.name,
        rotationPeriod: dto.rotationPeriod,
        orbitalPeriod: dto.orbitalPeriod,
        diameter: dto.diameter,
        climate: dto.climate,
        gravity: dto.gravity,
        terrain: dto.terrain,
        surfaceWater: dto.surfaceWater,
        population: dto.population,
        createdBy: actor,
        updatedBy: actor,
      },
      { conflictPaths: ['swapiId'] },
    );
    const saved = await this.findBySwapiId(dto.swapiId);
    if (!saved) {
      throw new Error(`Planet ${dto.swapiId} was upserted but cannot be found`);
    }
    return saved;
  }
}
