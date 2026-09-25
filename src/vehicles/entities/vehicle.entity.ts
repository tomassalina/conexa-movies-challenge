import { Column, Entity } from 'typeorm';
import { AuditableEntity } from '../../database/auditable.entity.js';

@Entity('vehicles')
export class Vehicle extends AuditableEntity {
  @Column({ type: 'varchar', length: 10, unique: true })
  swapiId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  model?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  manufacturer?: string | null;

  @Column({ type: 'bigint', nullable: true })
  costInCredits?: string | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  length?: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  maxAtmospheringSpeed?: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  crew?: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  passengers?: string | null;

  @Column({ type: 'bigint', nullable: true })
  cargoCapacity?: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  consumables?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  vehicleClass?: string | null;
}
