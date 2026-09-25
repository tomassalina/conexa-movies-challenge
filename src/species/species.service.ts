import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { SwapiSpeciesDto } from '../swapi/dto/species.dto.js';
import { Species } from './entities/species.entity.js';
import { Planet } from '../planets/entities/planet.entity.js';
import { User } from '../users/entities/user.entity.js';

@Injectable()
export class SpeciesService {
  constructor(
    @InjectRepository(Species)
    private readonly speciesRepository: Repository<Species>,
  ) {}

  findBySwapiId(swapiId: string): Promise<Species | null> {
    return this.speciesRepository.findOneBy({ swapiId });
  }

  async upsertFromSwapi(
    dto: SwapiSpeciesDto,
    actorUserId: string,
    planetId: string | null,
  ): Promise<Species> {
    const actor = { id: actorUserId } as User;
    await this.speciesRepository.upsert(
      {
        swapiId: dto.swapiId,
        name: dto.name,
        classification: dto.classification,
        designation: dto.designation,
        averageHeight: dto.averageHeight,
        skinColors: dto.skinColors,
        hairColors: dto.hairColors,
        eyeColors: dto.eyeColors,
        averageLifespan: dto.averageLifespan,
        language: dto.language,
        planet: planetId ? ({ id: planetId } as Planet) : null,
        createdBy: actor,
        updatedBy: actor,
      },
      { conflictPaths: ['swapiId'] },
    );
    const saved = await this.findBySwapiId(dto.swapiId);
    if (!saved) {
      throw new Error(`Species ${dto.swapiId} was upserted but cannot be found`);
    }
    return saved;
  }
}
