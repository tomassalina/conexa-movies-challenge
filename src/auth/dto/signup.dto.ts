import { z } from 'zod';
import { passwordSchema } from './password.schema.js';

/**
 * Deliberately has no `role` field: Zod silently drops any key not declared
 * in the schema, so a client sending `{ role: 'admin' }` in the body has it
 * discarded before AuthService ever sees it.
 */
export const signupSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
});

export type SignupDto = z.infer<typeof signupSchema>;
