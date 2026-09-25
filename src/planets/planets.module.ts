import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Planet } from './entities/planet.entity.js';
import { PlanetsService } from './planets.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Planet])],
  providers: [PlanetsService],
  exports: [PlanetsService],
})
export class PlanetsModule {}
