import { VehicleAdapter } from './vehicle.adapter.js';

describe('VehicleAdapter', () => {
  it('maps a raw swapi.tech vehicle item to SwapiVehicleDto', () => {
    const adapter = new VehicleAdapter();

    const dto = adapter.adapt({
      uid: '4',
      properties: {
        name: 'Sand Crawler',
        model: 'Digger Crawler',
        manufacturer: 'Corellia Mining Corporation',
        cost_in_credits: '150000',
        length: '36.8',
        max_atmosphering_speed: '30',
        crew: '46',
        passengers: '30',
        cargo_capacity: '50000',
        consumables: '2 months',
        vehicle_class: 'wheeled',
      },
    });

    expect(dto).toEqual({
      swapiId: '4',
      name: 'Sand Crawler',
      model: 'Digger Crawler',
      manufacturer: 'Corellia Mining Corporation',
      costInCredits: '150000',
      length: '36.8',
      maxAtmospheringSpeed: '30',
      crew: '46',
      passengers: '30',
      cargoCapacity: '50000',
      consumables: '2 months',
      vehicleClass: 'wheeled',
    });
  });
});
