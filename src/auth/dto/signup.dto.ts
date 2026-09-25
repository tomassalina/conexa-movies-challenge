import { z } from 'zod';

/**
 * Deliberately has no `role` field: Zod silently drops any key not declared
 * in the schema, so a client sending `{ role: 'admin' }` in the body has it
 * discarded before AuthService ever sees it.
 */
export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type SignupDto = z.infer<typeof signupSchema>;
