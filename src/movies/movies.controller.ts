import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { AnyAuthenticatedUser } from '../auth/decorators/any-authenticated-user.decorator.js';
import { Permissions } from '../auth/decorators/permissions.decorator.js';
import { Permission } from '../auth/enums/permission.enum.js';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface.js';
import { createMovieSchema, type CreateMovieDto } from './dto/create-movie.dto.js';
import { updateMovieSchema, type UpdateMovieDto } from './dto/update-movie.dto.js';
import {
  listMoviesQuerySchema,
  type ListMoviesQueryDto,
} from './dto/list-movies-query.dto.js';
import { MoviesService } from './movies.service.js';

@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get()
  @AnyAuthenticatedUser()
  findAll(@Query({ schema: listMoviesQuerySchema }) query: ListMoviesQueryDto) {
    return this.moviesService.findAllPaginated(query);
  }

  @Get(':id')
  @AnyAuthenticatedUser()
  findOne(@Param('id') id: string) {
    return this.moviesService.findOneOrFail(id);
  }

  @Post()
  @Permissions(Permission.MOVIES_WRITE)
  create(
    @Body({ schema: createMovieSchema }) dto: CreateMovieDto,
    @Req() request: RequestWithUser,
  ) {
    return this.moviesService.create(dto, request.user.sub);
  }

  @Patch(':id')
  @Permissions(Permission.MOVIES_WRITE)
  update(
    @Param('id') id: string,
    @Body({ schema: updateMovieSchema }) dto: UpdateMovieDto,
    @Req() request: RequestWithUser,
  ) {
    return this.moviesService.update(id, dto, request.user.sub);
  }

  @Delete(':id')
  @Permissions(Permission.MOVIES_WRITE)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.moviesService.remove(id);
  }

  @Get(':id/characters')
  @AnyAuthenticatedUser()
  findCharacters(@Param('id') id: string) {
    return this.moviesService.findCharacters(id);
  }

  @Get(':id/planets')
  @AnyAuthenticatedUser()
  findPlanets(@Param('id') id: string) {
    return this.moviesService.findPlanets(id);
  }

  @Get(':id/species')
  @AnyAuthenticatedUser()
  findSpecies(@Param('id') id: string) {
    return this.moviesService.findSpecies(id);
  }

  @Get(':id/starships')
  @AnyAuthenticatedUser()
  findStarships(@Param('id') id: string) {
    return this.moviesService.findStarships(id);
  }

  @Get(':id/vehicles')
  @AnyAuthenticatedUser()
  findVehicles(@Param('id') id: string) {
    return this.moviesService.findVehicles(id);
  }
}
