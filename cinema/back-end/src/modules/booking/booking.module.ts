import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { BookingController } from './booking.controller';
import { BOOKING_MAINTENANCE_QUEUE } from './booking.constants';
import { BookingService } from './booking.service';
import { BookingMaintenanceProcessor } from './maintenance/booking-maintenance.processor';
import { BookingMaintenanceScheduler } from './maintenance/booking-maintenance.scheduler';
import { SeatMapController } from './seat-map.controller';
import { SeatMapService } from './seat-map.service';

@Module({
  imports: [BullModule.registerQueue({ name: BOOKING_MAINTENANCE_QUEUE })],
  controllers: [BookingController, SeatMapController],
  providers: [
    BookingService,
    SeatMapService,
    BookingMaintenanceProcessor,
    BookingMaintenanceScheduler,
  ],
  exports: [BookingService],
})
export class BookingModule {}