import { Module } from '@nestjs/common';
import { HallsModule } from '../halls/halls.module';
import { MoviesModule } from '../movies/movies.module';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';

@Module({
  imports: [MoviesModule, HallsModule],
  controllers: [SessionsController],
  providers: [SessionsService],
})
export class SessionsModule {}