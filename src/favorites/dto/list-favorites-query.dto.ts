import { z } from 'zod';

/**
 * Same page/limit/sortBy/order shape as `listMoviesQuerySchema` /
 * `listRelatedQuerySchema`. `Favorite` only has one meaningful sort axis —
 * when it was favorited — so the whitelist is a single value.
 */
export const FAVORITE_SORT_FIELDS = ['createdAt'] as const;
export type FavoriteSortField = (typeof FAVORITE_SORT_FIELDS)[number];

export const listFavoritesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.enum(FAVORITE_SORT_FIELDS).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type ListFavoritesQueryDto = z.infer<typeof listFavoritesQuerySchema>;
