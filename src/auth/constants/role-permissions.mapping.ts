import { Role } from '../../users/enums/role.enum.js';
import { Permission } from '../enums/permission.enum.js';

export const RolePermissions: Record<Role, Permission[]> = {
  [Role.USER]: [Permission.MOVIES_READ],
  [Role.ADMIN]: [
    Permission.MOVIES_READ,
    Permission.MOVIES_WRITE,
    Permission.MOVIES_SYNC,
    Permission.USERS_MANAGE_ROLE,
  ],
};
