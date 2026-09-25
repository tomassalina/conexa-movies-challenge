import { CharacterAdapter } from './character.adapter.js';

describe('CharacterAdapter', () => {
  it('maps a raw swapi.tech person item to SwapiCharacterDto', () => {
    const adapter = new CharacterAdapter();

    const dto = adapter.adapt({
      uid: '1',
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
      },
    });

    expect(dto).toEqual({
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
    });
  });

  it('maps a missing homeworld to a null homeworldSwapiId', () => {
    const adapter = new CharacterAdapter();

    const dto = adapter.adapt({
      uid: '2',
      properties: {
        name: 'R2-D2',
        height: '96',
        mass: '32',
        hair_color: 'n/a',
        skin_color: 'white, blue',
        eye_color: 'red',
        birth_year: '33BBY',
        gender: 'n/a',
        homeworld: '',
      },
    });

    expect(dto.homeworldSwapiId).toBeNull();
    expect(dto.hairColor).toBeNull();
    expect(dto.gender).toBeNull();
  });
});
