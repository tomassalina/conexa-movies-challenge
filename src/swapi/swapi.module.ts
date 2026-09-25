import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CharactersModule } from '../characters/characters.module.js';
import { MoviesModule } from '../movies/movies.module.js';
import { PlanetsModule } from '../planets/planets.module.js';
import { SpeciesModule } from '../species/species.module.js';
import { StarshipsModule } from '../starships/starships.module.js';
import { VehiclesModule } from '../vehicles/vehicles.module.js';
import { SwapiSyncService } from './swapi-sync.service.js';
import { SwapiService } from './swapi.service.js';

@Module({
  imports: [
    HttpModule,
    PlanetsModule,
    CharactersModule,
    SpeciesModule,
    StarshipsModule,
    VehiclesModule,
    MoviesModule,
  ],
  providers: [SwapiService, SwapiSyncService],
  exports: [SwapiService, SwapiSyncService],
})
export class SwapiModule {}
