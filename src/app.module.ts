import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { envValidationSchema } from './config/env.validation.js';
import { SnakeNamingStrategy } from './database/naming-strategy.js';
import { AuthModule } from './auth/auth.module.js';
import { AuthGuard } from './auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from './auth/guards/permissions.guard.js';
import { UsersModule } from './users/users.module.js';
import { SwapiModule } from './swapi/swapi.module.js';
import { PlanetsModule } from './planets/planets.module.js';
import { CharactersModule } from './characters/characters.module.js';
import { SpeciesModule } from './species/species.module.js';
import { StarshipsModule } from './starships/starships.module.js';
import { VehiclesModule } from './vehicles/vehicles.module.js';
import { MoviesModule } from './movies/movies.module.js';
import { FavoritesModule } from './favorites/favorites.module.js';
import { HealthModule } from './health/health.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('DATABASE_HOST'),
        port: config.get<number>('DATABASE_PORT'),
        username: config.get<string>('DATABASE_USER'),
        password: config.get<string>('DATABASE_PASSWORD'),
        database: config.get<string>('DATABASE_NAME'),
        synchronize: false,
        namingStrategy: new SnakeNamingStrategy(),
        autoLoadEntities: true,
      }),
    }),
    UsersModule,
    AuthModule,
    SwapiModule,
    PlanetsModule,
    CharactersModule,
    SpeciesModule,
    StarshipsModule,
    VehiclesModule,
    MoviesModule,
    FavoritesModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Order matters: AuthGuard must run first to populate request.user
    // before PermissionsGuard reads request.user.role.
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
