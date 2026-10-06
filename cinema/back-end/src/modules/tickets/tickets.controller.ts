import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { JwtPayload } from '../../common/types/fastify';
import { ListTicketsDto } from './dto/list-tickets.dto';
import { TicketQrQueryDto } from './dto/ticket-qr-query.dto';
import { ValidateTicketDto } from './dto/validate-ticket.dto';
import { TicketQrService } from './ticket-qr.service';
import { TicketsService } from './tickets.service';

@Controller('tickets')
export class TicketsController {
  constructor(
    private tickets: TicketsService,
    private qr: TicketQrService,
  ) {}

  @Get('me')
  listMine(@CurrentUser() user: JwtPayload, @Query() query: ListTicketsDto) {
    return this.tickets.listMine(user.sub, query);
  }

  @Get(':id/qr')
  async qrImage(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: TicketQrQueryDto,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const { buffer, contentType } = await this.qr.render(user.sub, id, query.format, query.size);

    res.header('Cache-Control', 'private, max-age=3600');
    return new StreamableFile(buffer, {
      type: contentType,
      disposition: `inline; filename="ticket-${id}.${query.format}"`,
    });
  }

  @Roles('ADMIN')
  @Post('validate')
  @HttpCode(200)
  validate(@Body() dto: ValidateTicketDto) {
    return this.tickets.validate(dto.code);
  }
}
