import { ConflictException, NotFoundException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { Movie } from '../movies/entities/movie.entity.js';
import type { ListFavoritesQueryDto } from './dto/list-favorites-query.dto.js';
import { Favorite } from './entities/favorite.entity.js';
import { FavoritesService } from './favorites.service.js';

function baseQuery(overrides: Partial<ListFavoritesQueryDto> = {}): ListFavoritesQueryDto {
  return {
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    order: 'desc',
    ...overrides,
  };
}

describe('FavoritesService', () => {
  const userId = 'user-1';
  const movieId = 'movie-1';
  const movie = { id: movieId, title: 'A New Hope' } as Movie;

  function createService() {
    const favoritesRepository = {
      findOneBy: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      findAndCount: vi.fn(),
    } as unknown as Repository<Favorite>;
    const moviesRepository = {
      findOneBy: vi.fn(),
    } as unknown as Repository<Movie>;

    const service = new FavoritesService(favoritesRepository, moviesRepository);
    return { service, favoritesRepository, moviesRepository };
  }

  describe('add', () => {
    it('creates a favorite for the user when the movie exists and is not already favorited', async () => {
      const { service, favoritesRepository, moviesRepository } = createService();
      (moviesRepository.findOneBy as ReturnType<typeof vi.fn>).mockResolvedValue(movie);
      (favoritesRepository.findOneBy as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      const created = { userId, movieId } as Favorite;
      (favoritesRepository.create as ReturnType<typeof vi.fn>).mockReturnValue(created);
      (favoritesRepository.save as ReturnType<typeof vi.fn>).mockResolvedValue(created);

      const result = await service.add(userId, movieId);

      expect(moviesRepository.findOneBy).toHaveBeenCalledWith({ id: movieId });
      expect(favoritesRepository.findOneBy).toHaveBeenCalledWith({ userId, movieId });
      expect(favoritesRepository.create).toHaveBeenCalledWith({
        userId,
        movieId,
        createdBy: { id: userId },
      });
      expect(favoritesRepository.save).toHaveBeenCalledWith(created);
      expect(result).toBe(created);
    });

    it('throws NotFoundException when the movie does not exist', async () => {
      const { service, favoritesRepository, moviesRepository } = createService();
      (moviesRepository.findOneBy as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(service.add(userId, movieId)).rejects.toThrow(NotFoundException);
      expect(favoritesRepository.findOneBy).not.toHaveBeenCalled();
      expect(favoritesRepository.save).not.toHaveBeenCalled();
    });

    it('throws ConflictException when the movie is already favorited', async () => {
      const { service, favoritesRepository, moviesRepository } = createService();
      (moviesRepository.findOneBy as ReturnType<typeof vi.fn>).mockResolvedValue(movie);
      (favoritesRepository.findOneBy as ReturnType<typeof vi.fn>).mockResolvedValue({
        userId,
        movieId,
      } as Favorite);

      await expect(service.add(userId, movieId)).rejects.toThrow(ConflictException);
      expect(favoritesRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deletes the favorite when it exists', async () => {
      const { service, favoritesRepository } = createService();
      (favoritesRepository.findOneBy as ReturnType<typeof vi.fn>).mockResolvedValue({
        userId,
        movieId,
      } as Favorite);
      (favoritesRepository.delete as ReturnType<typeof vi.fn>).mockResolvedValue({ affected: 1 });

      await service.remove(userId, movieId);

      expect(favoritesRepository.findOneBy).toHaveBeenCalledWith({ userId, movieId });
      expect(favoritesRepository.delete).toHaveBeenCalledWith({ userId, movieId });
    });

    it('throws NotFoundException when the favorite does not exist', async () => {
      const { service, favoritesRepository } = createService();
      (favoritesRepository.findOneBy as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(service.remove(userId, movieId)).rejects.toThrow(NotFoundException);
      expect(favoritesRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('findAllForUser', () => {
    it('returns the favorited movies for the user with pagination meta', async () => {
      const { service, favoritesRepository } = createService();
      (favoritesRepository.findAndCount as ReturnType<typeof vi.fn>).mockResolvedValue([
        [{ userId, movieId, movie } as Favorite],
        1,
      ]);

      const result = await service.findAllForUser(userId, baseQuery());

      expect(favoritesRepository.findAndCount).toHaveBeenCalledWith({
        where: { userId },
        relations: { movie: true },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 10,
      });
      expect(result.data).toEqual([movie]);
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });

    it('computes pagination math on the boundary between two pages', async () => {
      const { service, favoritesRepository } = createService();
      (favoritesRepository.findAndCount as ReturnType<typeof vi.fn>).mockResolvedValue([
        [{ userId, movieId, movie } as Favorite],
        11,
      ]);

      const result = await service.findAllForUser(userId, baseQuery({ page: 2, limit: 10 }));

      expect(favoritesRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 }),
      );
      expect(result.meta).toEqual({
        total: 11,
        page: 2,
        totalPages: 2,
        hasNextPage: false,
        hasPreviousPage: true,
      });
    });

    it('returns an empty page when the user has no favorites', async () => {
      const { service, favoritesRepository } = createService();
      (favoritesRepository.findAndCount as ReturnType<typeof vi.fn>).mockResolvedValue([[], 0]);

      const result = await service.findAllForUser(userId, baseQuery());

      expect(result.data).toEqual([]);
      expect(result.meta).toEqual({
        total: 0,
        page: 1,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });

    it('honors the requested order', async () => {
      const { service, favoritesRepository } = createService();
      (favoritesRepository.findAndCount as ReturnType<typeof vi.fn>).mockResolvedValue([[], 0]);

      await service.findAllForUser(userId, baseQuery({ order: 'asc' }));

      expect(favoritesRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ order: { createdAt: 'ASC' } }),
      );
    });
  });
});
