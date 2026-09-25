import { PlanetAdapter } from './planet.adapter.js';

describe('PlanetAdapter', () => {
  it('maps a raw swapi.tech planet item to SwapiPlanetDto', () => {
    const adapter = new PlanetAdapter();

    const dto = adapter.adapt({
      uid: '1',
      properties: {
        name: 'Tatooine',
        rotation_period: '23',
        orbital_period: '304',
        diameter: '10465',
        climate: 'arid',
        gravity: '1 standard',
        terrain: 'desert',
        surface_water: '1',
        population: '200000',
      },
    });

    expect(dto).toEqual({
      swapiId: '1',
      name: 'Tatooine',
      rotationPeriod: 23,
      orbitalPeriod: 304,
      diameter: 10465,
      climate: 'arid',
      gravity: '1 standard',
      terrain: 'desert',
      surfaceWater: 1,
      population: '200000',
    });
  });

  it('normalizes "unknown" sentinels to null', () => {
    const adapter = new PlanetAdapter();

    const dto = adapter.adapt({
      uid: '2',
      properties: {
        name: "Yavin IV",
        rotation_period: 'unknown',
        orbital_period: 'unknown',
        diameter: 'unknown',
        climate: 'temperate, tropical',
        gravity: '1 standard',
        terrain: 'jungle, rainforests',
        surface_water: 'unknown',
        population: 'unknown',
      },
    });

    expect(dto.rotationPeriod).toBeNull();
    expect(dto.orbitalPeriod).toBeNull();
    expect(dto.diameter).toBeNull();
    expect(dto.surfaceWater).toBeNull();
    expect(dto.population).toBeNull();
  });
});
