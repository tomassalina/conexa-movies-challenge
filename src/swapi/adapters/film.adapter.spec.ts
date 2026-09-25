import { FilmAdapter } from './film.adapter.js';

describe('FilmAdapter', () => {
  it('maps a raw swapi.tech film item to SwapiFilmDto, extracting relation ids from urls', () => {
    const adapter = new FilmAdapter();

    const dto = adapter.adapt({
      uid: '1',
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
      },
    });

    expect(dto).toEqual({
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
    });
  });

  it('maps a missing episode_id to null', () => {
    const adapter = new FilmAdapter();

    const dto = adapter.adapt({
      uid: '2',
      properties: {
        title: 'Untitled',
        episode_id: undefined as unknown as number,
        opening_crawl: 'unknown',
        director: 'n/a',
        producer: 'n/a',
        release_date: 'n/a',
        characters: [],
        planets: [],
        starships: [],
        vehicles: [],
        species: [],
      },
    });

    expect(dto.episodeId).toBeNull();
    expect(dto.openingCrawl).toBeNull();
    expect(dto.director).toBeNull();
  });
});
