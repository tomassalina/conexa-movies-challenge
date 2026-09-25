import { Test, TestingModule } from '@nestjs/testing';
import type { Request } from 'express';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

describe('AppController', () => {
  let appController: AppController;

  const request = {
    protocol: 'http',
    get: (name: string) => (name === 'host' ? 'localhost:3000' : undefined),
  } as unknown as Request;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('returns the SWAPI-style resource discovery map', () => {
      expect(appController.getRoot(request)).toEqual({
        movies: 'http://localhost:3000/api/v1/movies',
        favorites: 'http://localhost:3000/api/v1/favorites',
        auth: 'http://localhost:3000/api/v1/auth',
        users: 'http://localhost:3000/api/v1/users',
        docs: 'http://localhost:3000/api/docs',
        health: 'http://localhost:3000/health',
      });
    });
  });

  describe('/api', () => {
    it('returns the same discovery map as root', () => {
      expect(appController.getApiRoot(request)).toEqual(appController.getRoot(request));
    });
  });

  describe('/api/v1', () => {
    it('returns the same discovery map as root', () => {
      expect(appController.getApiV1Root(request)).toEqual(appController.getRoot(request));
    });
  });
});
