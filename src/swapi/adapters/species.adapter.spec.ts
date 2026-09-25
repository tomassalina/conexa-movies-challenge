import { SpeciesAdapter } from './species.adapter.js';

describe('SpeciesAdapter', () => {
  it('maps a raw swapi.tech species item to SwapiSpeciesDto', () => {
    const adapter = new SpeciesAdapter();

    const dto = adapter.adapt({
      uid: '1',
      properties: {
        name: 'Human',
        classification: 'mammal',
        designation: 'sentient',
        average_height: '180',
        skin_colors: 'caucasian, black, asian, hispanic',
        hair_colors: 'blonde, brown, black, red',
        eye_colors: 'brown, blue, green, hazel, grey, amber',
        average_lifespan: '120',
        homeworld: 'https://www.swapi.tech/api/planets/9',
        language: 'Galactic Basic',
      },
    });

    expect(dto).toEqual({
      swapiId: '1',
      name: 'Human',
      classification: 'mammal',
      designation: 'sentient',
      averageHeight: '180',
      skinColors: 'caucasian, black, asian, hispanic',
      hairColors: 'blonde, brown, black, red',
      eyeColors: 'brown, blue, green, hazel, grey, amber',
      averageLifespan: 120,
      language: 'Galactic Basic',
      homeworldSwapiId: '9',
    });
  });

  it('maps a null homeworld to a null homeworldSwapiId', () => {
    const adapter = new SpeciesAdapter();

    const dto = adapter.adapt({
      uid: '2',
      properties: {
        name: 'Droid',
        classification: 'artificial',
        designation: 'sentient',
        average_height: 'n/a',
        skin_colors: 'n/a',
        hair_colors: 'n/a',
        eye_colors: 'n/a',
        average_lifespan: 'indefinite',
        homeworld: null,
        language: 'n/a',
      },
    });

    expect(dto.homeworldSwapiId).toBeNull();
    expect(dto.averageHeight).toBeNull();
    expect(dto.averageLifespan).toBeNull();
    expect(dto.language).toBeNull();
  });
});
