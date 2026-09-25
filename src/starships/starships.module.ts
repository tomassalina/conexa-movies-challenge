import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Starship } from './entities/starship.entity.js';
import { StarshipsService } from './starships.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Starship])],
  providers: [StarshipsService],
  exports: [StarshipsService],
})
export class StarshipsModule {}
