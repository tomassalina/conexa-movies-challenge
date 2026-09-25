import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from '../movies/entities/movie.entity.js';
import { Favorite } from './entities/favorite.entity.js';
import { FavoritesController } from './favorites.controller.js';
import { FavoritesService } from './favorites.service.js';

/**
 * Registers `Movie` alongside `Favorite` to check movie existence directly
 * via its repository — MoviesModule only exports MoviesService, which has
 * no simple "does this movie exist" method yet, and adding one there just
 * to satisfy this module would be unnecessary coupling for a single lookup.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Favorite, Movie])],
  controllers: [FavoritesController],
  providers: [FavoritesService],
})
export class FavoritesModule {}
