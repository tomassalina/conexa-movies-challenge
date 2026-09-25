import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movie } from '../movies/entities/movie.entity.js';
import { User } from '../users/entities/user.entity.js';
import { Favorite } from './entities/favorite.entity.js';

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

  async findAllForUser(userId: string): Promise<Movie[]> {
    const favorites = await this.favoritesRepository.find({
      where: { userId },
      relations: { movie: true },
    });
    return favorites.map((favorite) => favorite.movie);
  }
}
