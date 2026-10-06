import { Module } from '@nestjs/common';
import { GenresModule } from '../genres/genres.module';
import { MoviesController } from './movies.controller';
import { MoviesService } from './movies.service';
import { PostersController } from './posters.controller';
import { PostersService } from './posters.service';

@Module({
  imports: [GenresModule],
  controllers: [MoviesController, PostersController],
  providers: [MoviesService, PostersService],
  exports: [MoviesService],
})
export class MoviesModule {}
