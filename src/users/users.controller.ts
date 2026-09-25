import {
  Body,
  Controller,
  Param,
  Patch,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { Permissions } from '../auth/decorators/permissions.decorator.js';
import { Permission } from '../auth/enums/permission.enum.js';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface.js';
import { StripSensitiveFieldsInterceptor } from '../common/interceptors/strip-sensitive-fields.interceptor.js';
import { updateRoleSchema, type UpdateRoleDto } from './dto/update-role.dto.js';
import { UsersService } from './users.service.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch(':id/role')
  @Permissions(Permission.USERS_MANAGE_ROLE)
  @UseInterceptors(StripSensitiveFieldsInterceptor)
  updateRole(
    @Param('id') id: string,
    @Body({ schema: updateRoleSchema }) dto: UpdateRoleDto,
    @Req() request: RequestWithUser,
  ) {
    return this.usersService.updateRole(id, dto.role, request.user.sub);
  }
}
