import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { SwapiCharacterDto } from '../swapi/dto/character.dto.js';
import { Character } from './entities/character.entity.js';
import { Planet } from '../planets/entities/planet.entity.js';
import { User } from '../users/entities/user.entity.js';

@Injectable()
export class CharactersService {
  constructor(
    @InjectRepository(Character)
    private readonly charactersRepository: Repository<Character>,
  ) {}

  findBySwapiId(swapiId: string): Promise<Character | null> {
    return this.charactersRepository.findOneBy({ swapiId });
  }

  async upsertFromSwapi(
    dto: SwapiCharacterDto,
    actorUserId: string,
    planetId: string | null,
  ): Promise<Character> {
    const actor = { id: actorUserId } as User;
    await this.charactersRepository.upsert(
      {
        swapiId: dto.swapiId,
        name: dto.name,
        height: dto.height,
        mass: dto.mass,
        hairColor: dto.hairColor,
        skinColor: dto.skinColor,
        eyeColor: dto.eyeColor,
        birthYear: dto.birthYear,
        gender: dto.gender,
        planet: planetId ? ({ id: planetId } as Planet) : null,
        createdBy: actor,
        updatedBy: actor,
      },
      { conflictPaths: ['swapiId'] },
    );
    const saved = await this.findBySwapiId(dto.swapiId);
    if (!saved) {
      throw new Error(`Character ${dto.swapiId} was upserted but cannot be found`);
    }
    return saved;
  }
}
