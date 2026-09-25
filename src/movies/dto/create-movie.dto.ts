import { z } from 'zod';

/**
 * No `swapiId` field: that identifier is sync-only (see `MoviesService.upsertFromSwapi`).
 * A movie created through this endpoint is always manually authored and never
 * carries a SWAPI origin id.
 */
export const createMovieSchema = z.object({
  title: z.string().trim().min(1, 'title is required').max(255),
  episodeId: z.number().int().optional(),
  openingCrawl: z.string().trim().min(1).optional(),
  director: z.string().trim().min(1).max(255).optional(),
  producer: z.string().trim().min(1).max(255).optional(),
  releaseDate: z.iso.date().optional(),
  posterUrl: z.string().trim().url().max(2048).optional(),
});

export type CreateMovieDto = z.infer<typeof createMovieSchema>;
