import { Reflector } from '@nestjs/core';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface.js';
import { PERMISSIONS_KEY } from '../auth/decorators/permissions.decorator.js';
import { Permission } from '../auth/enums/permission.enum.js';
import { SwapiSyncController } from './swapi-sync.controller.js';
import type { SwapiSyncService } from './swapi-sync.service.js';

describe('SwapiSyncController', () => {
  describe('access control', () => {
    it('requires exactly the MOVIES_SYNC permission on the sync endpoint', () => {
      // Same discovery mechanism PermissionsGuard uses at request time
      // (see permissions.guard.spec.ts) — this proves the manual sync
      // endpoint is admin-only under the fail-closed guard, since it is
      // guarded by @Permissions(...) and not @Public()/@AnyAuthenticatedUser().
      const reflector = new Reflector();
      const requiredPermissions = reflector.get<Permission[] | undefined>(
        PERMISSIONS_KEY,
        SwapiSyncController.prototype.sync,
      );

      expect(requiredPermissions).toEqual([Permission.MOVIES_SYNC]);
    });
  });

  describe('sync', () => {
    it('triggers a full sync for the authenticated actor and reports completion', async () => {
      const swapiSyncService = {
        syncAll: vi.fn().mockResolvedValue(undefined),
      } as unknown as SwapiSyncService;
      const controller = new SwapiSyncController(swapiSyncService);
      const request = { user: { sub: 'admin-user-id' } } as RequestWithUser;

      const result = await controller.sync(request);

      expect(swapiSyncService.syncAll).toHaveBeenCalledWith('admin-user-id');
      expect(result).toEqual({ status: 'sync completed' });
    });
  });
});
