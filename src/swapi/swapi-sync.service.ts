import { Injectable, Logger } from '@nestjs/common';
import { PlanetsService } from '../planets/planets.service.js';
import { SwapiService } from './swapi.service.js';

@Injectable()
export class SwapiSyncService {
  private readonly logger = new Logger(SwapiSyncService.name);

  constructor(
    private readonly swapiService: SwapiService,
    private readonly planetsService: PlanetsService,
  ) {}

  async syncPlanets(actorUserId: string): Promise<number> {
    const planets = await this.swapiService.fetchPlanets();
    for (const planet of planets) {
      await this.planetsService.upsertFromSwapi(planet, actorUserId);
    }
    this.logger.log(`Synced ${planets.length} planets`);
    return planets.length;
  }
}
