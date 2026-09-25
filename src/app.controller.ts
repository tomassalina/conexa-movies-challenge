import { Controller, Get, Req, Version, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AppService, type ApiDiscovery } from './app.service.js';
import { Public } from './auth/decorators/public.decorator.js';

@ApiTags('discovery')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Version(VERSION_NEUTRAL)
  @Get()
  @ApiOperation({ summary: 'SWAPI-style resource discovery, no auth required' })
  @ApiResponse({ status: 200, description: 'Map of this API\'s resources to their URLs' })
  getRoot(@Req() request: Request): ApiDiscovery {
    return this.appService.getDiscovery(request);
  }

  @Public()
  @Version(VERSION_NEUTRAL)
  @Get('api')
  @ApiOperation({ summary: 'SWAPI-style resource discovery, no auth required' })
  @ApiResponse({ status: 200, description: 'Map of this API\'s resources to their URLs' })
  getApiRoot(@Req() request: Request): ApiDiscovery {
    return this.appService.getDiscovery(request);
  }

  // Version-neutral so it lands on the v1 prefix without an extra `/v1`
  // segment inserted by URI versioning — this route already spells it out.
  @Public()
  @Version(VERSION_NEUTRAL)
  @Get('v1')
  @ApiOperation({ summary: "The v1 API's own resource discovery, no auth required" })
  @ApiResponse({ status: 200, description: 'Map of this API\'s resources to their URLs' })
  getApiV1Root(@Req() request: Request): ApiDiscovery {
    return this.appService.getDiscovery(request);
  }
}
