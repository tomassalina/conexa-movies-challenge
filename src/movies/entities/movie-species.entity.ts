import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { CreatedAuditEntity } from '../../database/auditable.entity.js';
import { Species } from '../../species/entities/species.entity.js';
import { Movie } from './movie.entity.js';

@Entity('movie_species')
export class MovieSpecies extends CreatedAuditEntity {
  @PrimaryColumn('uuid')
  movieId!: string;

  @PrimaryColumn('uuid')
  speciesId!: string;

  @ManyToOne(() => Movie, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'movie_id' })
  movie!: Movie;

  @ManyToOne(() => Species, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'species_id' })
  species!: Species;
}
