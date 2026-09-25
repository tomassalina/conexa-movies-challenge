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
            message: 'ok',
            total_records: 2,
            total_pages: 2,
            previous: null,
            next: 'https://www.swapi.tech/api/planets?page=2&limit=1&expanded=true',
            results: [
              {
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
                  url: 'https://www.swapi.tech/api/planets/1',
                },
                _id: '5f7254c11b7dfa00041c6fae',
                description: 'A planet.',
                uid: '1',
                __v: 2,
              },
            ],
          },
        }),
      )
      .mockReturnValueOnce(
        of({
          data: {
            message: 'ok',
            total_records: 2,
            total_pages: 2,
            previous: 'https://www.swapi.tech/api/planets?page=1&limit=1&expanded=true',
            next: null,
            results: [
              {
                properties: {
                  name: 'Alderaan',
                  rotation_period: '24',
                  orbital_period: '364',
                  diameter: '12500',
                  climate: 'temperate',
                  gravity: '1 standard',
                  terrain: 'grasslands, mountains',
                  surface_water: '40',
                  population: '2000000000',
                  url: 'https://www.swapi.tech/api/planets/2',
                },
                _id: '5f7254c11b7dfa00041c6faf',
                description: 'A planet.',
                uid: '2',
                __v: 2,
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
    expect(getMock).toHaveBeenNthCalledWith(
      1,
      'https://www.swapi.tech/api/planets?page=1&limit=100&expanded=true',
    );
    expect(getMock).toHaveBeenNthCalledWith(
      2,
      'https://www.swapi.tech/api/planets?page=2&limit=1&expanded=true',
    );
  });

  it('reads relation ids and the item uid for characters, including a null homeworld', async () => {
    const getMock = vi.fn().mockReturnValueOnce(
      of({
        data: {
          message: 'ok',
          total_records: 1,
          total_pages: 1,
          previous: null,
          next: null,
          results: [
            {
              properties: {
                name: 'Luke Skywalker',
                height: '172',
                mass: '77',
                hair_color: 'blond',
                skin_color: 'fair',
                eye_color: 'blue',
                birth_year: '19BBY',
                gender: 'male',
                homeworld: 'https://www.swapi.tech/api/planets/1',
                url: 'https://www.swapi.tech/api/people/1',
              },
              _id: '5f63a36eee9fd7000499be42',
              description: 'A person within the Star Wars universe',
              uid: '1',
              __v: 4,
            },
          ],
        },
      }),
    );
    const service = createService(getMock);

    const characters = await service.fetchCharacters();

    expect(characters).toEqual([
      {
        swapiId: '1',
        name: 'Luke Skywalker',
        height: 172,
        mass: 77,
        hairColor: 'blond',
        skinColor: 'fair',
        eyeColor: 'blue',
        birthYear: '19BBY',
        gender: 'male',
        homeworldSwapiId: '1',
      },
    ]);
  });

  it('fetches films from the unpaginated `result` array (not `results`)', async () => {
    const getMock = vi.fn().mockReturnValueOnce(
      of({
        data: {
          message: 'ok',
          result: [
            {
              properties: {
                title: 'A New Hope',
                episode_id: 4,
                opening_crawl: 'It is a period of civil war.',
                director: 'George Lucas',
                producer: 'Gary Kurtz, Rick McCallum',
                release_date: '1977-05-25',
                characters: ['https://www.swapi.tech/api/people/1'],
                planets: ['https://www.swapi.tech/api/planets/1'],
                starships: ['https://www.swapi.tech/api/starships/2'],
                vehicles: ['https://www.swapi.tech/api/vehicles/4'],
                species: ['https://www.swapi.tech/api/species/1'],
                url: 'https://www.swapi.tech/api/films/1',
              },
              _id: '5f63a117cf50d100047f9762',
              description: 'A Star Wars Film',
              uid: '1',
              __v: 2,
            },
          ],
        },
      }),
    );
    const service = createService(getMock);

    const films = await service.fetchFilms();

    expect(getMock).toHaveBeenCalledTimes(1);
    expect(getMock).toHaveBeenCalledWith('https://www.swapi.tech/api/films?expanded=true');
    expect(films).toEqual([
      {
        swapiId: '1',
        title: 'A New Hope',
        episodeId: 4,
        openingCrawl: 'It is a period of civil war.',
        director: 'George Lucas',
        producer: 'Gary Kurtz, Rick McCallum',
        releaseDate: '1977-05-25',
        characterSwapiIds: ['1'],
        planetSwapiIds: ['1'],
        starshipSwapiIds: ['2'],
        vehicleSwapiIds: ['4'],
        speciesSwapiIds: ['1'],
      },
    ]);
  });

  it('wraps a SWAPI network/timeout failure in ServiceUnavailableException', async () => {
    const getMock = vi.fn().mockReturnValue(throwError(() => new Error('timeout')));
    const service = createService(getMock);

    await expect(service.fetchPlanets()).rejects.toThrow(ServiceUnavailableException);
  });
});
