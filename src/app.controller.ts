import { Controller, Get, Req, Version, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import type { Request } from 'express';
import { AppService, type ApiDiscovery } from './app.service.js';
import { Public } from './auth/decorators/public.decorator.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // Meta/discovery endpoints, not part of the documented API surface — kept
  // out of Swagger entirely rather than tagged.
  @Public()
  @Version(VERSION_NEUTRAL)
  @Get()
  @ApiExcludeEndpoint()
  getRoot(@Req() request: Request): ApiDiscovery {
    return this.appService.getDiscovery(request);
  }

  @Public()
  @Version(VERSION_NEUTRAL)
  @Get('api')
  @ApiExcludeEndpoint()
  getApiRoot(@Req() request: Request): ApiDiscovery {
    return this.appService.getDiscovery(request);
  }

  // Version-neutral so it lands on the v1 prefix without an extra `/v1`
  // segment inserted by URI versioning — this route already spells it out.
  @Public()
  @Version(VERSION_NEUTRAL)
  @Get('v1')
  @ApiExcludeEndpoint()
  getApiV1Root(@Req() request: Request): ApiDiscovery {
    return this.appService.getDiscovery(request);
  }
}
