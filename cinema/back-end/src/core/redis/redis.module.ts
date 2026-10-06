import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { SeatEventsService } from './seat-events.service';

@Global()
@Module({
  providers: [RedisService, SeatEventsService],
  exports: [RedisService, SeatEventsService],
})
export class RedisModule {}
