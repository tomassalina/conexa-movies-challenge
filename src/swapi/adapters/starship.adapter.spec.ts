import { StarshipAdapter } from './starship.adapter.js';

describe('StarshipAdapter', () => {
  it('maps a raw swapi.tech starship item to SwapiStarshipDto', () => {
    const adapter = new StarshipAdapter();

    const dto = adapter.adapt({
      uid: '9',
      properties: {
        name: 'Death Star',
        model: 'DS-1 Orbital Battle Station',
        manufacturer: 'Imperial Department of Military Research',
        cost_in_credits: '1000000000000',
        length: '120000',
        max_atmosphering_speed: 'n/a',
        crew: '342953',
        passengers: '843342',
        cargo_capacity: '1000000000000',
        consumables: '3 years',
        hyperdrive_rating: '4.0',
        MGLT: '10',
        starship_class: 'Deep Space Mobile Battlestation',
      },
    });

    expect(dto).toEqual({
      swapiId: '9',
      name: 'Death Star',
      model: 'DS-1 Orbital Battle Station',
      manufacturer: 'Imperial Department of Military Research',
      costInCredits: '1000000000000',
      length: '120000',
      maxAtmospheringSpeed: null,
      crew: '342953',
      passengers: '843342',
      cargoCapacity: '1000000000000',
      consumables: '3 years',
      hyperdriveRating: '4.0',
      mglt: 10,
      starshipClass: 'Deep Space Mobile Battlestation',
    });
  });
});
