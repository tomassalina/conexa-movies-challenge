import { Column, Entity, JoinColumn, ManyToOne, RelationId } from 'typeorm';
import { AuditableEntity } from '../../database/auditable.entity.js';
import { Planet } from '../../planets/entities/planet.entity.js';

@Entity('species')
export class Species extends AuditableEntity {
  @Column({ type: 'varchar', length: 10, unique: true })
  swapiId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  classification?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  designation?: string | null;

  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
  averageHeight?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  skinColors?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  hairColors?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  eyeColors?: string | null;

  @Column({ type: 'smallint', nullable: true })
  averageLifespan?: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  language?: string | null;

  @ManyToOne(() => Planet, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn()
  planet?: Planet | null;

  @RelationId((species: Species) => species.planet)
  planetId?: string | null;
}
