import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service.js';
import { Public } from './auth/decorators/public.decorator.js';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Liveness check — returns a static greeting, no auth required' })
  @ApiResponse({ status: 200, description: 'Service is up', type: String })
  getHello(): string {
    return this.appService.getHello();
  }
}
