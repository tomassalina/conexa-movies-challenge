import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { CreatedAuditEntity } from '../../database/auditable.entity.js';
import { Starship } from '../../starships/entities/starship.entity.js';
import { Movie } from './movie.entity.js';

@Entity('movie_starship')
export class MovieStarship extends CreatedAuditEntity {
  @PrimaryColumn('uuid')
  movieId!: string;

  @PrimaryColumn('uuid')
  starshipId!: string;

  @ManyToOne(() => Movie, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'movie_id' })
  movie!: Movie;

  @ManyToOne(() => Starship, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'starship_id' })
  starship!: Starship;
}
