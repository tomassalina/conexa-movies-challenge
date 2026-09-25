import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { CreatedAuditEntity } from '../../database/auditable.entity.js';
import { Planet } from '../../planets/entities/planet.entity.js';
import { Movie } from './movie.entity.js';

@Entity('movie_planet')
export class MoviePlanet extends CreatedAuditEntity {
  @PrimaryColumn('uuid')
  movieId!: string;

  @PrimaryColumn('uuid')
  planetId!: string;

  @ManyToOne(() => Movie, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'movie_id' })
  movie!: Movie;

  @ManyToOne(() => Planet, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'planet_id' })
  planet!: Planet;
}
