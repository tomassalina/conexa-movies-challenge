import { z } from 'zod';
import { createMovieSchema } from './create-movie.dto.js';

/**
 * Partial update: every field from `createMovieSchema` becomes optional, so a
 * client only sends the fields it wants to change. `swapiId` stays excluded —
 * it can never be assigned through this endpoint.
 */
export const updateMovieSchema = createMovieSchema.partial();

export type UpdateMovieDto = z.infer<typeof updateMovieSchema>;
