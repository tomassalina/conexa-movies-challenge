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
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AnyAuthenticatedUser } from '../auth/decorators/any-authenticated-user.decorator.js';
import { Permissions } from '../auth/decorators/permissions.decorator.js';
import { Permission } from '../auth/enums/permission.enum.js';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface.js';
import { zodQueryParams, zodToOpenApiSchema } from '../common/openapi/zod-schema.util.js';
import { createMovieSchema, type CreateMovieDto } from './dto/create-movie.dto.js';
import { updateMovieSchema, type UpdateMovieDto } from './dto/update-movie.dto.js';
import {
  listMoviesQuerySchema,
  type ListMoviesQueryDto,
} from './dto/list-movies-query.dto.js';
import { MoviesService } from './movies.service.js';

const movieIdParam = { name: 'id', description: 'Movie id (uuid)' };

@ApiTags('movies')
@ApiBearerAuth()
@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get()
  @AnyAuthenticatedUser()
  @ApiOperation({ summary: 'List movies, paginated and sortable' })
  @zodQueryParams(listMoviesQuerySchema)
  @ApiResponse({ status: 200, description: 'Paginated list of movies' })
  @ApiResponse({ status: 401, description: 'Missing/invalid bearer token' })
  findAll(@Query({ schema: listMoviesQuerySchema }) query: ListMoviesQueryDto) {
    return this.moviesService.findAllPaginated(query);
  }

  @Get(':id')
  @AnyAuthenticatedUser()
  @ApiOperation({ summary: 'Get a single movie by id' })
  @ApiParam(movieIdParam)
  @ApiResponse({ status: 200, description: 'The movie' })
  @ApiResponse({ status: 401, description: 'Missing/invalid bearer token' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  findOne(@Param('id') id: string) {
    return this.moviesService.findOneOrFail(id);
  }

  @Post()
  @Permissions(Permission.MOVIES_WRITE)
  @ApiOperation({ summary: 'Create a manually authored movie (admin-only)' })
  @ApiBody({ schema: zodToOpenApiSchema(createMovieSchema) })
  @ApiResponse({ status: 201, description: 'Movie created' })
  @ApiResponse({ status: 401, description: 'Missing/invalid bearer token' })
  @ApiResponse({ status: 403, description: 'Caller lacks the movies:write permission' })
  create(
    @Body({ schema: createMovieSchema }) dto: CreateMovieDto,
    @Req() request: RequestWithUser,
  ) {
    return this.moviesService.create(dto, request.user.sub);
  }

  @Patch(':id')
  @Permissions(Permission.MOVIES_WRITE)
  @ApiOperation({ summary: 'Update a movie (admin-only)' })
  @ApiParam(movieIdParam)
  @ApiBody({ schema: zodToOpenApiSchema(updateMovieSchema) })
  @ApiResponse({ status: 200, description: 'Movie updated' })
  @ApiResponse({ status: 401, description: 'Missing/invalid bearer token' })
  @ApiResponse({ status: 403, description: 'Caller lacks the movies:write permission' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
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
  @ApiOperation({ summary: 'Soft-delete a movie (admin-only)' })
  @ApiParam(movieIdParam)
  @ApiResponse({ status: 204, description: 'Movie deleted' })
  @ApiResponse({ status: 401, description: 'Missing/invalid bearer token' })
  @ApiResponse({ status: 403, description: 'Caller lacks the movies:write permission' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  remove(@Param('id') id: string) {
    return this.moviesService.remove(id);
  }

  @Get(':id/characters')
  @AnyAuthenticatedUser()
  @ApiOperation({ summary: 'List the characters that appear in a movie' })
  @ApiParam(movieIdParam)
  @ApiResponse({ status: 200, description: 'List of characters' })
  @ApiResponse({ status: 401, description: 'Missing/invalid bearer token' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  findCharacters(@Param('id') id: string) {
    return this.moviesService.findCharacters(id);
  }

  @Get(':id/planets')
  @AnyAuthenticatedUser()
  @ApiOperation({ summary: 'List the planets that appear in a movie' })
  @ApiParam(movieIdParam)
  @ApiResponse({ status: 200, description: 'List of planets' })
  @ApiResponse({ status: 401, description: 'Missing/invalid bearer token' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  findPlanets(@Param('id') id: string) {
    return this.moviesService.findPlanets(id);
  }

  @Get(':id/species')
  @AnyAuthenticatedUser()
  @ApiOperation({ summary: 'List the species that appear in a movie' })
  @ApiParam(movieIdParam)
  @ApiResponse({ status: 200, description: 'List of species' })
  @ApiResponse({ status: 401, description: 'Missing/invalid bearer token' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  findSpecies(@Param('id') id: string) {
    return this.moviesService.findSpecies(id);
  }

  @Get(':id/starships')
  @AnyAuthenticatedUser()
  @ApiOperation({ summary: 'List the starships that appear in a movie' })
  @ApiParam(movieIdParam)
  @ApiResponse({ status: 200, description: 'List of starships' })
  @ApiResponse({ status: 401, description: 'Missing/invalid bearer token' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  findStarships(@Param('id') id: string) {
    return this.moviesService.findStarships(id);
  }

  @Get(':id/vehicles')
  @AnyAuthenticatedUser()
  @ApiOperation({ summary: 'List the vehicles that appear in a movie' })
  @ApiParam(movieIdParam)
  @ApiResponse({ status: 200, description: 'List of vehicles' })
  @ApiResponse({ status: 401, description: 'Missing/invalid bearer token' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  findVehicles(@Param('id') id: string) {
    return this.moviesService.findVehicles(id);
  }
}
