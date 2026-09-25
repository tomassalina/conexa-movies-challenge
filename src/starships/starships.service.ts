import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { SwapiStarshipDto } from '../swapi/dto/starship.dto.js';
import { Starship } from './entities/starship.entity.js';
import { User } from '../users/entities/user.entity.js';

@Injectable()
export class StarshipsService {
  constructor(
    @InjectRepository(Starship)
    private readonly starshipsRepository: Repository<Starship>,
  ) {}

  findBySwapiId(swapiId: string): Promise<Starship | null> {
    return this.starshipsRepository.findOneBy({ swapiId });
  }

  async upsertFromSwapi(dto: SwapiStarshipDto, actorUserId: string): Promise<Starship> {
    const actor = { id: actorUserId } as User;
    await this.starshipsRepository.upsert(
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
        hyperdriveRating: dto.hyperdriveRating,
        mglt: dto.mglt,
        starshipClass: dto.starshipClass,
        createdBy: actor,
        updatedBy: actor,
      },
      { conflictPaths: ['swapiId'] },
    );
    const saved = await this.findBySwapiId(dto.swapiId);
    if (!saved) {
      throw new Error(`Starship ${dto.swapiId} was upserted but cannot be found`);
    }
    return saved;
  }
}
