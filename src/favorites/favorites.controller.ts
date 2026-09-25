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
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AnyAuthenticatedUser } from '../auth/decorators/any-authenticated-user.decorator.js';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface.js';
import { Movie } from '../movies/entities/movie.entity.js';
import { Favorite } from './entities/favorite.entity.js';
import { FavoritesService } from './favorites.service.js';

const movieIdParam = { name: 'movieId', description: 'Movie id (uuid)' };

/**
 * Every route here is `@AnyAuthenticatedUser()`: favoriting is a personal
 * action any logged-in user may do for themselves, with no admin/user
 * distinction. The user id always comes from the JWT (`request.user.sub`),
 * never from a route/body value, so a user can only ever touch their own
 * favorites.
 */
@ApiTags('favorites')
@ApiBearerAuth()
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post(':movieId')
  @AnyAuthenticatedUser()
  @ApiOperation({ summary: "Add a movie to the caller's favorites" })
  @ApiParam(movieIdParam)
  @ApiResponse({ status: 201, description: 'Movie added to favorites' })
  @ApiResponse({ status: 401, description: 'Missing/invalid bearer token' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  @ApiResponse({ status: 409, description: 'Movie is already in favorites' })
  add(
    @Param('movieId') movieId: string,
    @Req() request: RequestWithUser,
  ): Promise<Favorite> {
    return this.favoritesService.add(request.user.sub, movieId);
  }

  @Delete(':movieId')
  @AnyAuthenticatedUser()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Remove a movie from the caller's favorites" })
  @ApiParam(movieIdParam)
  @ApiResponse({ status: 204, description: 'Movie removed from favorites' })
  @ApiResponse({ status: 401, description: 'Missing/invalid bearer token' })
  @ApiResponse({ status: 404, description: 'Favorite not found' })
  remove(
    @Param('movieId') movieId: string,
    @Req() request: RequestWithUser,
  ): Promise<void> {
    return this.favoritesService.remove(request.user.sub, movieId);
  }

  @Get()
  @AnyAuthenticatedUser()
  @ApiOperation({ summary: "List the caller's favorite movies" })
  @ApiResponse({ status: 200, description: 'List of favorited movies' })
  @ApiResponse({ status: 401, description: 'Missing/invalid bearer token' })
  findAll(@Req() request: RequestWithUser): Promise<Movie[]> {
    return this.favoritesService.findAllForUser(request.user.sub);
  }
}
