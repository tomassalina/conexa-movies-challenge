import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { AnyAuthenticatedUser } from '../auth/decorators/any-authenticated-user.decorator.js';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface.js';
import { Movie } from '../movies/entities/movie.entity.js';
import { Favorite } from './entities/favorite.entity.js';
import { FavoritesService } from './favorites.service.js';

/**
 * Every route here is `@AnyAuthenticatedUser()`: favoriting is a personal
 * action any logged-in user may do for themselves, with no admin/user
 * distinction. The user id always comes from the JWT (`request.user.sub`),
 * never from a route/body value, so a user can only ever touch their own
 * favorites.
 */
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post(':movieId')
  @AnyAuthenticatedUser()
  add(
    @Param('movieId') movieId: string,
    @Req() request: RequestWithUser,
  ): Promise<Favorite> {
    return this.favoritesService.add(request.user.sub, movieId);
  }

  @Delete(':movieId')
  @AnyAuthenticatedUser()
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('movieId') movieId: string,
    @Req() request: RequestWithUser,
  ): Promise<void> {
    return this.favoritesService.remove(request.user.sub, movieId);
  }

  @Get()
  @AnyAuthenticatedUser()
  findAll(@Req() request: RequestWithUser): Promise<Movie[]> {
    return this.favoritesService.findAllForUser(request.user.sub);
  }
}
