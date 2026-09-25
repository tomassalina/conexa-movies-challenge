import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Character } from './entities/character.entity.js';
import { CharactersService } from './characters.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Character])],
  providers: [CharactersService],
  exports: [CharactersService],
})
export class CharactersModule {}
