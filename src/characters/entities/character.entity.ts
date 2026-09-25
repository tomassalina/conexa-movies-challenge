import { Column, Entity, JoinColumn, ManyToOne, RelationId } from 'typeorm';
import { AuditableEntity } from '../../database/auditable.entity.js';
import { Planet } from '../../planets/entities/planet.entity.js';

@Entity('characters')
export class Character extends AuditableEntity {
  @Column({ type: 'varchar', length: 10, unique: true })
  swapiId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'smallint', nullable: true })
  height?: number | null;

  @Column({ type: 'integer', nullable: true })
  mass?: number | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  hairColor?: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  skinColor?: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  eyeColor?: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  birthYear?: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  gender?: string | null;

  @ManyToOne(() => Planet, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn()
  planet?: Planet | null;

  @RelationId((character: Character) => character.planet)
  planetId?: string | null;
}
