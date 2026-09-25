import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UsersService } from '../users/users.service.js';
import { SwapiSyncService } from './swapi-sync.service.js';

/**
 * Runs syncAll() attributed to the admin identified by ADMIN_EMAIL — the same
 * env var the (not yet built, Fase 5) seed script will use to create the
 * first admin. Once that seed exists, this resolves automatically with no
 * changes here. Until then, it no-ops with a warning if that admin doesn't
 * exist yet, instead of crashing the scheduler.
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
