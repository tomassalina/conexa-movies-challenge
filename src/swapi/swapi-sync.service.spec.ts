import type { CharactersService } from '../characters/characters.service.js';
import type { MoviesService } from '../movies/movies.service.js';
import type { PlanetsService } from '../planets/planets.service.js';
import type { SpeciesService } from '../species/species.service.js';
import type { StarshipsService } from '../starships/starships.service.js';
import type { VehiclesService } from '../vehicles/vehicles.service.js';
import { SwapiSyncService } from './swapi-sync.service.js';
import type { SwapiService } from './swapi.service.js';

const ACTOR_USER_ID = 'actor-user-id';

function buildService() {
  const swapiService = {
    fetchPlanets: vi.fn(),
    fetchCharacters: vi.fn(),
    fetchSpecies: vi.fn(),
    fetchStarships: vi.fn(),
    fetchVehicles: vi.fn(),
    fetchFilms: vi.fn(),
  } as unknown as SwapiService;

  const planetsService = {
    upsertFromSwapi: vi.fn(),
    findBySwapiId: vi.fn(),
  } as unknown as PlanetsService;

  const charactersService = {
    upsertFromSwapi: vi.fn(),
    findBySwapiId: vi.fn(),
  } as unknown as CharactersService;

  const speciesService = {
    upsertFromSwapi: vi.fn(),
    findBySwapiId: vi.fn(),
  } as unknown as SpeciesService;

  const starshipsService = {
    upsertFromSwapi: vi.fn(),
    findBySwapiId: vi.fn(),
  } as unknown as StarshipsService;

  const vehiclesService = {
    upsertFromSwapi: vi.fn(),
    findBySwapiId: vi.fn(),
  } as unknown as VehiclesService;

  const moviesService = {
    upsertFromSwapi: vi.fn(),
    linkRelations: vi.fn(),
  } as unknown as MoviesService;

  const service = new SwapiSyncService(
    swapiService,
    planetsService,
    charactersService,
    speciesService,
    starshipsService,
    vehiclesService,
    moviesService,
  );

  return {
    service,
    swapiService,
    planetsService,
    charactersService,
    speciesService,
    starshipsService,
    vehiclesService,
    moviesService,
  };
}

describe('SwapiSyncService', () => {
  describe('syncPlanets', () => {
    it('upserts every fetched planet and returns the count synced', async () => {
      const { service, swapiService, planetsService } = buildService();
      const planets = [
        { swapiId: '1', name: 'Tatooine' },
        { swapiId: '2', name: 'Alderaan' },
      ];
      (swapiService.fetchPlanets as ReturnType<typeof vi.fn>).mockResolvedValue(planets);

      const count = await service.syncPlanets(ACTOR_USER_ID);

      expect(count).toBe(2);
      expect(planetsService.upsertFromSwapi).toHaveBeenCalledTimes(2);
      expect(planetsService.upsertFromSwapi).toHaveBeenCalledWith(planets[0], ACTOR_USER_ID);
      expect(planetsService.upsertFromSwapi).toHaveBeenCalledWith(planets[1], ACTOR_USER_ID);
    });
  });

  describe('syncCharacters', () => {
    it('resolves the homeworld planet and links it by local id when the character has one', async () => {
      const { service, swapiService, planetsService, charactersService } = buildService();
      const character = { swapiId: '1', name: 'Luke Skywalker', homeworldSwapiId: '1' };
      (swapiService.fetchCharacters as ReturnType<typeof vi.fn>).mockResolvedValue([character]);
      (planetsService.findBySwapiId as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'planet-local-uuid',
        swapiId: '1',
      });

      const count = await service.syncCharacters(ACTOR_USER_ID);

      expect(count).toBe(1);
      expect(planetsService.findBySwapiId).toHaveBeenCalledWith('1');
      expect(charactersService.upsertFromSwapi).toHaveBeenCalledWith(
        character,
        ACTOR_USER_ID,
        'planet-local-uuid',
      );
    });

    it('does not look up a homeworld and links null when the character has none', async () => {
      const { service, swapiService, planetsService, charactersService } = buildService();
      const character = { swapiId: '2', name: 'Droid Unit', homeworldSwapiId: null };
      (swapiService.fetchCharacters as ReturnType<typeof vi.fn>).mockResolvedValue([character]);

      await service.syncCharacters(ACTOR_USER_ID);

      expect(planetsService.findBySwapiId).not.toHaveBeenCalled();
      expect(charactersService.upsertFromSwapi).toHaveBeenCalledWith(
        character,
        ACTOR_USER_ID,
        null,
      );
    });

    it('links null when the referenced homeworld cannot be found locally', async () => {
      const { service, swapiService, planetsService, charactersService } = buildService();
      const character = { swapiId: '3', name: 'Orphan', homeworldSwapiId: '999' };
      (swapiService.fetchCharacters as ReturnType<typeof vi.fn>).mockResolvedValue([character]);
      (planetsService.findBySwapiId as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await service.syncCharacters(ACTOR_USER_ID);

      expect(charactersService.upsertFromSwapi).toHaveBeenCalledWith(
        character,
        ACTOR_USER_ID,
        null,
      );
    });
  });

  describe('syncCatalog', () => {
    it('syncs planets before the other four catalogs (FK dependency)', async () => {
      const {
        service,
        swapiService,
        planetsService,
        charactersService,
        speciesService,
        starshipsService,
        vehiclesService,
      } = buildService();
      const callOrder: string[] = [];
      (swapiService.fetchPlanets as ReturnType<typeof vi.fn>).mockImplementation(async () => {
        callOrder.push('planets');
        return [];
      });
      (swapiService.fetchCharacters as ReturnType<typeof vi.fn>).mockImplementation(async () => {
        callOrder.push('characters');
        return [];
      });
      (swapiService.fetchSpecies as ReturnType<typeof vi.fn>).mockImplementation(async () => {
        callOrder.push('species');
        return [];
      });
      (swapiService.fetchStarships as ReturnType<typeof vi.fn>).mockImplementation(async () => {
        callOrder.push('starships');
        return [];
      });
      (swapiService.fetchVehicles as ReturnType<typeof vi.fn>).mockImplementation(async () => {
        callOrder.push('vehicles');
        return [];
      });

      await service.syncCatalog(ACTOR_USER_ID);

      expect(callOrder[0]).toBe('planets');
      expect(callOrder).toHaveLength(5);
      expect(planetsService.upsertFromSwapi).not.toHaveBeenCalled(); // no planets fetched
      expect(charactersService.upsertFromSwapi).not.toHaveBeenCalled();
      expect(speciesService.upsertFromSwapi).not.toHaveBeenCalled();
      expect(starshipsService.upsertFromSwapi).not.toHaveBeenCalled();
      expect(vehiclesService.upsertFromSwapi).not.toHaveBeenCalled();
    });

    it('runs the four leaf catalogs concurrently after planets settle', async () => {
      const { service, swapiService } = buildService();
      (swapiService.fetchPlanets as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (swapiService.fetchCharacters as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (swapiService.fetchSpecies as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (swapiService.fetchStarships as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (swapiService.fetchVehicles as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      await service.syncCatalog(ACTOR_USER_ID);

      expect(swapiService.fetchCharacters).toHaveBeenCalled();
      expect(swapiService.fetchSpecies).toHaveBeenCalled();
      expect(swapiService.fetchStarships).toHaveBeenCalled();
      expect(swapiService.fetchVehicles).toHaveBeenCalled();
    });
  });

  describe('syncMovies', () => {
    it('resolves each relation type to local ids, filters out unresolved ones, and links them', async () => {
      const {
        service,
        swapiService,
        moviesService,
        charactersService,
        planetsService,
        starshipsService,
        speciesService,
      } = buildService();
      const film = {
        swapiId: '1',
        title: 'A New Hope',
        characterSwapiIds: ['1', '2'],
        planetSwapiIds: ['1'],
        starshipSwapiIds: ['9'],
        vehicleSwapiIds: [],
        speciesSwapiIds: ['1'],
      };
      (swapiService.fetchFilms as ReturnType<typeof vi.fn>).mockResolvedValue([film]);
      (moviesService.upsertFromSwapi as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'movie-uuid',
        swapiId: '1',
      });
      (charactersService.findBySwapiId as ReturnType<typeof vi.fn>).mockImplementation(
        async (id: string) => (id === '1' ? { id: 'char-1-uuid' } : null),
      );
      (planetsService.findBySwapiId as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'planet-1-uuid',
      });
      (starshipsService.findBySwapiId as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'starship-9-uuid',
      });
      (speciesService.findBySwapiId as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'species-1-uuid',
      });

      const count = await service.syncMovies(ACTOR_USER_ID);

      expect(count).toBe(1);
      expect(moviesService.upsertFromSwapi).toHaveBeenCalledWith(film, ACTOR_USER_ID);
      expect(moviesService.linkRelations).toHaveBeenCalledWith(
        'movie-uuid',
        {
          characterIds: ['char-1-uuid'], // character "2" was unresolved and dropped
          planetIds: ['planet-1-uuid'],
          starshipIds: ['starship-9-uuid'],
          vehicleIds: [],
          speciesIds: ['species-1-uuid'],
        },
        ACTOR_USER_ID,
      );
    });
  });

  describe('syncAll', () => {
    it('syncs the catalog before movies, since movies depend on catalog relations', async () => {
      const { service, swapiService, moviesService } = buildService();
      const callOrder: string[] = [];
      (swapiService.fetchPlanets as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (swapiService.fetchCharacters as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (swapiService.fetchSpecies as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (swapiService.fetchStarships as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (swapiService.fetchVehicles as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (swapiService.fetchFilms as ReturnType<typeof vi.fn>).mockImplementation(async () => {
        callOrder.push('films');
        return [];
      });
      const originalSyncCatalog = service.syncCatalog.bind(service);
      vi.spyOn(service, 'syncCatalog').mockImplementation(async (actorUserId: string) => {
        callOrder.push('catalog');
        await originalSyncCatalog(actorUserId);
      });

      await service.syncAll(ACTOR_USER_ID);

      expect(callOrder).toEqual(['catalog', 'films']);
      expect(moviesService.linkRelations).not.toHaveBeenCalled(); // no films fetched
    });
  });
});
