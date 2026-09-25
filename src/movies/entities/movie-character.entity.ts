import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { CreatedAuditEntity } from '../../database/auditable.entity.js';
import { Character } from '../../characters/entities/character.entity.js';
import { Movie } from './movie.entity.js';

@Entity('movie_character')
export class MovieCharacter extends CreatedAuditEntity {
  @PrimaryColumn('uuid')
  movieId!: string;

  @PrimaryColumn('uuid')
  characterId!: string;

  @ManyToOne(() => Movie, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'movie_id' })
  movie!: Movie;

  @ManyToOne(() => Character, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'character_id' })
  character!: Character;
}
