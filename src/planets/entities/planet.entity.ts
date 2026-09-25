import { Column, Entity } from 'typeorm';
import { AuditableEntity } from '../../database/auditable.entity.js';

@Entity('planets')
export class Planet extends AuditableEntity {
  @Column({ type: 'varchar', length: 10, unique: true })
  swapiId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'integer', nullable: true })
  rotationPeriod?: number | null;

  @Column({ type: 'integer', nullable: true })
  orbitalPeriod?: number | null;

  @Column({ type: 'integer', nullable: true })
  diameter?: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  climate?: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  gravity?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  terrain?: string | null;

  @Column({ type: 'smallint', nullable: true })
  surfaceWater?: number | null;

  @Column({ type: 'bigint', nullable: true })
  population?: string | null;
}
