import { z } from 'zod';
import { Role } from '../enums/role.enum.js';

export const updateRoleSchema = z.object({
  role: z.enum(Role),
});

export type UpdateRoleDto = z.infer<typeof updateRoleSchema>;
