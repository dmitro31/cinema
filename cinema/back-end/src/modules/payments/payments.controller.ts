// modules/payments/payments.controller.ts
import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, UsePipes } from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import type { JwtPayload } from '../../common/types/fastify.js';
import { CreateCheckoutDto } from './dto/create-checkout.dto.js';
import { PaymentsService } from './payments.service.js';
import { RefundsService } from './refunds.service.js';

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

  callback(@Body() body: Record<string, any>) {
    const data = body?.data;
    const signature = body?.signature;

    return this.payments.handleCallback(data, signature);
  }
}
