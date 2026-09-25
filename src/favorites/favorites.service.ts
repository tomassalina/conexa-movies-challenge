import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movie } from '../movies/entities/movie.entity.js';
import { User } from '../users/entities/user.entity.js';
import type { PaginatedResult } from '../common/pagination/paginated-result.interface.js';
import type { FavoriteSortField, ListFavoritesQueryDto } from './dto/list-favorites-query.dto.js';
import { Favorite } from './entities/favorite.entity.js';

/**
 * Same whitelist pattern as `MoviesService`'s `SORT_COLUMNS` — only entry
 * today is `createdAt`, but kept as a map rather than hardcoding the column
 * so a future sortable field follows the same shape.
 */
const FAVORITE_SORT_COLUMNS: Record<FavoriteSortField, keyof Favorite> = {
  createdAt: 'createdAt',
};
const DEFAULT_FAVORITE_SORT_FIELD: FavoriteSortField = 'createdAt';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private readonly favoritesRepository: Repository<Favorite>,
    @InjectRepository(Movie)
    private readonly moviesRepository: Repository<Movie>,
  ) {}

  async add(userId: string, movieId: string): Promise<Favorite> {
    const movie = await this.moviesRepository.findOneBy({ id: movieId });
    if (!movie) {
      throw new NotFoundException(`Movie ${movieId} not found`);
    }

    const existing = await this.favoritesRepository.findOneBy({ userId, movieId });
    if (existing) {
      throw new ConflictException('Movie is already in favorites');
    }

    const favorite = this.favoritesRepository.create({
      userId,
      movieId,
      createdBy: { id: userId } as User,
    });
    return this.favoritesRepository.save(favorite);
  }

  async remove(userId: string, movieId: string): Promise<void> {
    const existing = await this.favoritesRepository.findOneBy({ userId, movieId });
    if (!existing) {
      throw new NotFoundException('Favorite not found');
    }
    await this.favoritesRepository.delete({ userId, movieId });
  }

  async findAllForUser(
    userId: string,
    query: ListFavoritesQueryDto,
  ): Promise<PaginatedResult<Movie>> {
    const { page, limit, sortBy, order } = query;
    const sortColumn = FAVORITE_SORT_COLUMNS[sortBy] ?? FAVORITE_SORT_COLUMNS[DEFAULT_FAVORITE_SORT_FIELD];

    const [favorites, total] = await this.favoritesRepository.findAndCount({
      where: { userId },
      relations: { movie: true },
      order: { [sortColumn]: order.toUpperCase() as 'ASC' | 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: favorites.map((favorite) => favorite.movie),
      meta: {
        total,
        page,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }
}
