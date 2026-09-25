import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Species } from './entities/species.entity.js';
import { SpeciesService } from './species.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Species])],
  providers: [SpeciesService],
  exports: [SpeciesService],
})
export class SpeciesModule {}
