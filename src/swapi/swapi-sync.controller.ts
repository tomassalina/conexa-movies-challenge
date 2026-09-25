import { Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator.js';
import { Permission } from '../auth/enums/permission.enum.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface.js';
import { SwapiSyncService } from './swapi-sync.service.js';

@Controller('movies')
export class SwapiSyncController {
  constructor(private readonly swapiSyncService: SwapiSyncService) {}

  @Post('sync')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.MOVIES_SYNC)
  @HttpCode(HttpStatus.ACCEPTED)
  async sync(@Req() request: RequestWithUser): Promise<{ status: string }> {
    await this.swapiSyncService.syncAll(request.user.sub);
    return { status: 'sync completed' };
  }
}
