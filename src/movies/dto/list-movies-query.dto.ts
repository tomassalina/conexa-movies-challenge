import { z } from 'zod';

/**
 * Strict whitelist of columns a client may sort by. This is the only thing
 * that stands between a raw query string and a TypeORM `order` clause — never
 * let `sortBy` reach the repository without passing through this enum first
 * (SQL-injection-adjacent risk on the column name).
 */
export const MOVIE_SORT_FIELDS = ['title', 'releaseDate', 'episodeId', 'createdAt'] as const;
export type MovieSortField = (typeof MOVIE_SORT_FIELDS)[number];

export const listMoviesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.enum(MOVIE_SORT_FIELDS).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type ListMoviesQueryDto = z.infer<typeof listMoviesQuerySchema>;
