import {
  Body,
  Controller,
  Param,
  Patch,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../auth/decorators/permissions.decorator.js';
import { Permission } from '../auth/enums/permission.enum.js';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface.js';
import { zodToOpenApiSchema } from '../common/openapi/zod-schema.util.js';
import { StripSensitiveFieldsInterceptor } from '../common/interceptors/strip-sensitive-fields.interceptor.js';
import { updateRoleSchema, type UpdateRoleDto } from './dto/update-role.dto.js';
import { UsersService } from './users.service.js';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch(':id/role')
  @Permissions(Permission.USERS_MANAGE_ROLE)
  @UseInterceptors(StripSensitiveFieldsInterceptor)
  @ApiOperation({ summary: "Update a user's role (admin-only)" })
  @ApiParam({ name: 'id', description: 'Target user id (uuid)' })
  @ApiBody({ schema: zodToOpenApiSchema(updateRoleSchema) })
  @ApiResponse({ status: 200, description: 'Role updated, returns the updated user' })
  @ApiResponse({ status: 401, description: 'Missing/invalid bearer token' })
  @ApiResponse({ status: 403, description: 'Caller lacks the users:manage-role permission' })
  @ApiResponse({ status: 404, description: 'Target user not found' })
  updateRole(
    @Param('id') id: string,
    @Body({ schema: updateRoleSchema }) dto: UpdateRoleDto,
    @Req() request: RequestWithUser,
  ) {
    return this.usersService.updateRole(id, dto.role, request.user.sub);
  }
}
