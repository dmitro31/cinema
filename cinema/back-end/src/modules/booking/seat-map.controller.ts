import { Controller, Get, Param, ParseUUIDPipe, Req, Res } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { Public } from '../../common/decorators/public.decorator';
import { SeatEventsService } from '../../core/redis/seat-events.service';
import { SeatMapService } from './seat-map.service';

const HEARTBEAT_MS = 20_000;

@Controller('sessions')
export class SeatMapController {
  constructor(
    private seatMap: SeatMapService,
    private events: SeatEventsService,
  ) {}

  @Public()
  @Get(':id/seats')
  getSeatMap(@Param('id', ParseUUIDPipe) id: string) {
    return this.seatMap.getSeatMap(id);
  }

  @Public()
  @SkipThrottle()
  @Get(':id/seats/stream')
  async stream(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: FastifyRequest,
    @Res() reply: FastifyReply,
  ) {
    await this.seatMap.assertSessionExists(id);

    reply.hijack();

    const headers = reply.getHeaders();
    for (const [key, value] of Object.entries(headers)) {
      if (value !== undefined) {
        reply.raw.setHeader(key, value as number | string | string[]);
      }
    }

    reply.raw.statusCode = 200;
    reply.raw.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    reply.raw.setHeader('Cache-Control', 'no-cache, no-transform');
    reply.raw.setHeader('Connection', 'keep-alive');
    reply.raw.setHeader('X-Accel-Buffering', 'no');

    const write = (chunk: string) => {
      if (reply.raw.writableEnded || reply.raw.destroyed) return;
      reply.raw.write(chunk);
    };

    write('retry: 3000\n\n');
    write('event: ready\ndata: {}\n\n');

    const unsubscribe = this.events.subscribe(id, (seatIds) => {
      write(`event: seats-changed\ndata: ${JSON.stringify({ seatIds })}\n\n`);
    });
    const heartbeat = setInterval(() => write(': ping\n\n'), HEARTBEAT_MS);

    req.raw.on('close', () => {
      clearInterval(heartbeat);
      unsubscribe();
    });
  }
}
