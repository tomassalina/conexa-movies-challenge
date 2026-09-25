import { Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { Permissions } from '../auth/decorators/permissions.decorator.js';
import { Permission } from '../auth/enums/permission.enum.js';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface.js';
import { SwapiSyncService } from './swapi-sync.service.js';

@Controller('movies')
export class SwapiSyncController {
  constructor(private readonly swapiSyncService: SwapiSyncService) {}

  @Post('sync')
  @Permissions(Permission.MOVIES_SYNC)
  @HttpCode(HttpStatus.ACCEPTED)
  async sync(@Req() request: RequestWithUser): Promise<{ status: string }> {
    await this.swapiSyncService.syncAll(request.user.sub);
    return { status: 'sync completed' };
  }
}
