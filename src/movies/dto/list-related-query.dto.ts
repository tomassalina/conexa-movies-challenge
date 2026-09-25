import { z } from 'zod';

/**
 * Shared pagination/sort schema for the 5 nested relation routes
 * (characters/planets/species/starships/vehicles). Every related entity
 * exposes `name` and `createdAt`, so one schema covers all 5 instead of
 * duplicating `listMoviesQuerySchema`'s shape per resource.
 */
export const RELATED_RESOURCE_SORT_FIELDS = ['name', 'createdAt'] as const;
export type RelatedResourceSortField = (typeof RELATED_RESOURCE_SORT_FIELDS)[number];

export const listRelatedQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.enum(RELATED_RESOURCE_SORT_FIELDS).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type ListRelatedQueryDto = z.infer<typeof listRelatedQuerySchema>;
