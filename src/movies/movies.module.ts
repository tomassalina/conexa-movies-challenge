import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from './entities/movie.entity.js';
import { MovieCharacter } from './entities/movie-character.entity.js';
import { MoviePlanet } from './entities/movie-planet.entity.js';
import { MovieSpecies } from './entities/movie-species.entity.js';
import { MovieStarship } from './entities/movie-starship.entity.js';
import { MovieVehicle } from './entities/movie-vehicle.entity.js';
import { MoviesService } from './movies.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Movie,
      MoviePlanet,
      MovieCharacter,
      MovieSpecies,
      MovieStarship,
      MovieVehicle,
    ]),
  ],
  providers: [MoviesService],
  exports: [MoviesService],
})
export class MoviesModule {}
