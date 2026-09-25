import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity.js';
import { Role } from './enums/role.enum.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ email });
  }

  findById(id: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ id });
  }

  create(email: string, passwordHash: string): Promise<User> {
    const user = this.usersRepository.create({
      email,
      passwordHash,
      role: Role.USER,
    });
    return this.usersRepository.save(user);
  }

  async updateRole(id: string, role: Role, actorId: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    user.role = role;
    user.updatedBy = { id: actorId } as User;
    return this.usersRepository.save(user);
  }
}
