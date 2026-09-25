import { z } from 'zod';

/**
 * No `swapiId` field: that identifier is sync-only (see `MoviesService.upsertFromSwapi`).
 * A movie created through this endpoint is always manually authored and never
 * carries a SWAPI origin id.
 */
export const createMovieSchema = z.object({
  title: z.string().trim().min(1, 'title is required').max(255),
  // Column is `smallint` (-32768..32767); episode numbers are always small
  // positive integers, so bound it here instead of letting an out-of-range
  // value reach Postgres and crash with a raw driver error.
  episodeId: z.number().int().min(1).max(32767).optional(),
  openingCrawl: z.string().trim().min(1).optional(),
  director: z.string().trim().min(1).max(255).optional(),
  producer: z.string().trim().min(1).max(255).optional(),
  releaseDate: z.iso.date().optional(),
  posterUrl: z.string().trim().url().max(2048).optional(),
});

export type CreateMovieDto = z.infer<typeof createMovieSchema>;
