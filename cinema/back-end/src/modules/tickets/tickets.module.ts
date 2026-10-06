import { Module } from '@nestjs/common';
import { TicketQrService } from './ticket-qr.service';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';

@Module({
  controllers: [TicketsController],
  providers: [TicketsService, TicketQrService],
})
export class TicketsModule {}
