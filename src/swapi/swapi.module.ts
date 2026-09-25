import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PlanetsModule } from '../planets/planets.module.js';
import { SwapiSyncService } from './swapi-sync.service.js';
import { SwapiService } from './swapi.service.js';

@Module({
  imports: [HttpModule, PlanetsModule],
  providers: [SwapiService, SwapiSyncService],
  exports: [SwapiService, SwapiSyncService],
})
export class SwapiModule {}
