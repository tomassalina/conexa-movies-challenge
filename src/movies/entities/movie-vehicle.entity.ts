import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { CreatedAuditEntity } from '../../database/auditable.entity.js';
import { Vehicle } from '../../vehicles/entities/vehicle.entity.js';
import { Movie } from './movie.entity.js';

@Entity('movie_vehicle')
export class MovieVehicle extends CreatedAuditEntity {
  @PrimaryColumn('uuid')
  movieId!: string;

  @PrimaryColumn('uuid')
  vehicleId!: string;

  @ManyToOne(() => Movie, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'movie_id' })
  movie!: Movie;

  @ManyToOne(() => Vehicle, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle!: Vehicle;
}
