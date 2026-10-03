import { Body, Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { JwtPayload } from '../../common/types/fastify';
import { ListTicketsDto } from './dto/list-tickets.dto';
import { ValidateTicketDto } from './dto/validate-ticket.dto';
import { TicketsService } from './tickets.service';

@Controller('tickets')
export class TicketsController {
  constructor(private tickets: TicketsService) {}

  @Get('me')
  listMine(@CurrentUser() user: JwtPayload, @Query() query: ListTicketsDto) {
    return this.tickets.listMine(user.sub, query);
  }

  @Roles('ADMIN')
  @Post('validate')
  @HttpCode(200)
  validate(@Body() dto: ValidateTicketDto) {
    return this.tickets.validate(dto.code);
  }
}