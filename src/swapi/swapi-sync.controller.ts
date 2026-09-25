import { Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../auth/decorators/permissions.decorator.js';
import { Permission } from '../auth/enums/permission.enum.js';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface.js';
import { SwapiSyncService } from './swapi-sync.service.js';

@ApiTags('swapi-sync')
@ApiBearerAuth()
@Controller('movies')
export class SwapiSyncController {
  constructor(private readonly swapiSyncService: SwapiSyncService) {}

  @Post('sync')
  @Permissions(Permission.MOVIES_SYNC)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary:
      'Trigger a full catalog sync from the public Star Wars API (SWAPI) — planets, ' +
      'characters, species, starships, vehicles and movies (admin-only)',
  })
  @ApiResponse({ status: 202, description: 'Sync accepted and completed' })
  @ApiResponse({ status: 401, description: 'Missing/invalid bearer token' })
  @ApiResponse({ status: 403, description: 'Caller lacks the movies:sync permission' })
  async sync(@Req() request: RequestWithUser): Promise<{ status: string }> {
    await this.swapiSyncService.syncAll(request.user.sub);
    return { status: 'sync completed' };
  }
}
