import { z } from 'zod';

/**
 * 72 is not arbitrary: bcrypt only ever reads the first 72 bytes of the
 * input and silently ignores the rest (no error). We reject anything longer
 * outright instead of letting bcrypt truncate it unnoticed.
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(72, 'Password cannot exceed 72 characters (bcrypt limit)')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one symbol');
