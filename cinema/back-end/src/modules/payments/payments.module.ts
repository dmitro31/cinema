import { Module } from '@nestjs/common';
import { BookingModule } from '../booking/booking.module';
import { LiqPayService } from './liqpay.service';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { RefundsService } from './refunds.service';

@Module({
  imports: [BookingModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, RefundsService, LiqPayService],
})
export class PaymentsModule {}
