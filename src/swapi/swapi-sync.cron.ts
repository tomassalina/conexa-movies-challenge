import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UsersService } from '../users/users.service.js';
import { SwapiSyncService } from './swapi-sync.service.js';

/**
 * Runs syncAll() attributed to the admin identified by ADMIN_EMAIL — the same
 * account the seed script (src/database/seeds/create-admin.seed.ts) creates.
 * No-ops with a warning instead of crashing the scheduler if that admin
 * doesn't exist yet (e.g. the seed hasn't been run in this environment).
 */
@Injectable()
export class SwapiSyncCron {
  private readonly logger = new Logger(SwapiSyncCron.name);

  constructor(
    private readonly swapiSyncService: SwapiSyncService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron(): Promise<void> {
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    const admin = adminEmail ? await this.usersService.findByEmail(adminEmail) : null;
    if (!admin) {
      this.logger.warn(
        `Skipping scheduled SWAPI sync: no admin found for ADMIN_EMAIL (${adminEmail ?? 'unset'})`,
      );
      return;
    }
    this.logger.log('Starting scheduled SWAPI sync');
    await this.swapiSyncService.syncAll(admin.id);
    this.logger.log('Scheduled SWAPI sync finished');
  }
}
