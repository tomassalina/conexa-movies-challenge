import { ServiceUnavailableException } from '@nestjs/common';
import type { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { SwapiService } from './swapi.service.js';

function createService(getMock: ReturnType<typeof vi.fn>) {
  const httpService = { get: getMock } as unknown as HttpService;
  return new SwapiService(httpService);
}

describe('SwapiService', () => {
  it('follows the `next` field across pages and concatenates results', async () => {
    const getMock = vi
      .fn()
      .mockReturnValueOnce(
        of({
          data: {
            count: 2,
            next: 'https://swapi.dev/api/planets/?page=2',
            previous: null,
            results: [
              {
                name: 'Tatooine',
                rotation_period: '23',
                orbital_period: '304',
                diameter: '10465',
                climate: 'arid',
                gravity: '1 standard',
                terrain: 'desert',
                surface_water: '1',
                population: '200000',
                url: 'https://swapi.dev/api/planets/1/',
              },
            ],
          },
        }),
      )
      .mockReturnValueOnce(
        of({
          data: {
            count: 2,
            next: null,
            previous: 'https://swapi.dev/api/planets/?page=1',
            results: [
              {
                name: 'Alderaan',
                rotation_period: '24',
                orbital_period: '364',
                diameter: '12500',
                climate: 'temperate',
                gravity: '1 standard',
                terrain: 'grasslands, mountains',
                surface_water: '40',
                population: '2000000000',
                url: 'https://swapi.dev/api/planets/2/',
              },
            ],
          },
        }),
      );
    const service = createService(getMock);

    const planets = await service.fetchPlanets();

    expect(planets).toHaveLength(2);
    expect(planets.map((p) => p.swapiId)).toEqual(['1', '2']);
    expect(planets[1]).toMatchObject({ name: 'Alderaan', population: '2000000000' });
    expect(getMock).toHaveBeenCalledTimes(2);
    expect(getMock).toHaveBeenNthCalledWith(1, 'https://swapi.dev/api/planets/');
    expect(getMock).toHaveBeenNthCalledWith(
      2,
      'https://swapi.dev/api/planets/?page=2',
    );
  });

  it('wraps a SWAPI network/timeout failure in ServiceUnavailableException', async () => {
    const getMock = vi.fn().mockReturnValue(throwError(() => new Error('timeout')));
    const service = createService(getMock);

    await expect(service.fetchPlanets()).rejects.toThrow(ServiceUnavailableException);
  });
});
