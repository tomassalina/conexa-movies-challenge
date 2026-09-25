import { Column, Entity } from 'typeorm';
import { AuditableEntity } from '../../database/auditable.entity.js';

@Entity('movies')
export class Movie extends AuditableEntity {
  @Column({ type: 'varchar', length: 10, unique: true, nullable: true })
  swapiId?: string | null;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'smallint', nullable: true })
  episodeId?: number | null;

  @Column({ type: 'text', nullable: true })
  openingCrawl?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  director?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  producer?: string | null;

  @Column({ type: 'date', nullable: true })
  releaseDate?: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  posterUrl?: string | null;
}
