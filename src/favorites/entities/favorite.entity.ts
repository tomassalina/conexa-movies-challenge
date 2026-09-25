import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { CreatedAuditEntity } from '../../database/auditable.entity.js';
import { Movie } from '../../movies/entities/movie.entity.js';
import { User } from '../../users/entities/user.entity.js';

@Entity('favorites')
export class Favorite extends CreatedAuditEntity {
  @PrimaryColumn('uuid')
  userId!: string;

  @PrimaryColumn('uuid')
  movieId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Movie, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'movie_id' })
  movie!: Movie;
}
