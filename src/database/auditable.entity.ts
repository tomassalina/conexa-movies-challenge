import { Exclude } from 'class-transformer';
import {
  CreateDateColumn,
  DeleteDateColumn,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/entities/user.entity.js';

/**
 * Full audit trail for domain catalog tables (planets, characters, species,
 * starships, vehicles, movies). created_by/updated_by are NOT NULL here: a
 * row in these tables is always attributable to either an authenticated
 * admin (from the JWT) or the seeded admin (for SWAPI sync writes) — unlike
 * `users`, which is the only table that can be created without any prior
 * authenticated actor (public signup).
 */
export abstract class AuditableEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @Exclude()
  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by' })
  createdBy!: User;

  @RelationId((entity: AuditableEntity) => entity.createdBy)
  createdById!: string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @Exclude()
  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'updated_by' })
  updatedBy!: User;

  @RelationId((entity: AuditableEntity) => entity.updatedBy)
  updatedById!: string;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt?: Date | null;

  @Exclude()
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'deleted_by' })
  deletedBy?: User | null;

  @RelationId((entity: AuditableEntity) => entity.deletedBy)
  deletedById?: string | null;
}

/**
 * Light audit for pure link tables (movie_* junctions and favorites):
 * only created_at/created_by, no updated/deleted — these rows are either
 * replaced wholesale by a re-sync or hard-deleted (unfavorite), never
 * "edited" or soft-deleted in place.
 */
export abstract class CreatedAuditEntity {
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @Exclude()
  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by' })
  createdBy!: User;

  @RelationId((entity: CreatedAuditEntity) => entity.createdBy)
  createdById!: string;
}
