import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/types/fastify';
import { BookingService } from './booking.service';
import { HoldSeatsDto } from './dto/hold-seats.dto';
import { ListOrdersDto } from './dto/list-orders.dto';

@Controller('booking')
export class BookingController {
  constructor(
    private booking: BookingService,
    private config: ConfigService,
  ) {}

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('hold')
  hold(@CurrentUser() user: JwtPayload, @Body() dto: HoldSeatsDto) {
    return this.booking.hold(user.sub, dto);
  }

  @Get('orders')
  list(@CurrentUser() user: JwtPayload, @Query() query: ListOrdersDto) {
    return this.booking.listMine(user.sub, query);
  }

  @Get('orders/:id')
  findOne(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.booking.getOrder(user.sub, id);
  }

  @Delete('orders/:id')
  @HttpCode(204)
  cancel(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.booking.cancel(user.sub, id);
  }

  @Post('orders/:id/dev-pay')
  @HttpCode(200)
  async devPay(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    if (this.config.get<string>('NODE_ENV') === 'production') throw new NotFoundException();
    await this.booking.getOrder(user.sub, id);
    return this.booking.confirmPayment(id);
  }
}