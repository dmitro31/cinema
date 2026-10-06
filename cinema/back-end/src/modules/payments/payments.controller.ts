import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type { JwtPayload } from '../../common/types/fastify';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { LiqPayCallbackDto } from './dto/liqpay-callback.dto';
import { PaymentsService } from './payments.service';
import { RefundsService } from './refunds.service';

@Controller('payments')
export class PaymentsController {
  constructor(
    private payments: PaymentsService,
    private refunds: RefundsService,
  ) {}

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('checkout')
  checkout(@CurrentUser() user: JwtPayload, @Body() dto: CreateCheckoutDto) {
    return this.payments.createCheckout(user.sub, dto.orderId);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('orders/:orderId/refund')
  @HttpCode(200)
  refund(@CurrentUser() user: JwtPayload, @Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.refunds.refundOrder(user.sub, orderId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.payments.getPayment(user.sub, id);
  }

  @Public()
  @SkipThrottle()
  @Post('liqpay/callback')
  @HttpCode(200)
  callback(@Body() dto: LiqPayCallbackDto) {
    return this.payments.handleCallback(dto.data, dto.signature);
  }
}
