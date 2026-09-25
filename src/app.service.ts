import { Injectable } from '@nestjs/common';
import type { Request } from 'express';

export interface ApiDiscovery {
  movies: string;
  favorites: string;
  auth: string;
  users: string;
  docs: string;
  health: string;
}

@Injectable()
export class AppService {
  /**
   * SWAPI-style resource discovery (see https://www.swapi.tech/api): a map of
   * this API's own resources to their absolute URLs, derived from the
   * incoming request so it resolves correctly both locally and once deployed.
   */
  getDiscovery(request: Request): ApiDiscovery {
    const baseUrl = `${request.protocol}://${request.get('host')}`;
    return {
      movies: `${baseUrl}/api/v1/movies`,
      favorites: `${baseUrl}/api/v1/favorites`,
      auth: `${baseUrl}/api/v1/auth`,
      users: `${baseUrl}/api/v1/users`,
      docs: `${baseUrl}/api/docs`,
      health: `${baseUrl}/health`,
    };
  }
}
