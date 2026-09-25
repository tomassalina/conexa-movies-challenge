import { z } from 'zod';

export const envValidationSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  DATABASE_HOST: z.string().min(1),
  DATABASE_PORT: z.coerce.number().int().positive().default(5432),
  DATABASE_USER: z.string().min(1),
  DATABASE_PASSWORD: z.string().min(1),
  DATABASE_NAME: z.string().min(1),

  JWT_SECRET: z.string().min(1),
  JWT_EXPIRES_IN: z.string().min(1).default('1d'),

  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: z.string().min(8),
});

export type EnvConfig = z.infer<typeof envValidationSchema>;
