import type { Request } from 'express';
import type { Role } from '../../users/enums/role.enum.js';

export interface JwtPayload {
  sub: string;
  role: Role;
}

export interface RequestWithUser extends Request {
  user: JwtPayload;
}
