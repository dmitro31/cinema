import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { BOOKING_MAINTENANCE_QUEUE, EXPIRE_ORDERS_JOB } from "../booking.constants"
import { BookingService } from '../booking.service';

@Processor(BOOKING_MAINTENANCE_QUEUE)
export class BookingMaintenanceProcessor extends WorkerHost {
  private readonly logger = new Logger(BookingMaintenanceProcessor.name);

  constructor(private booking: BookingService) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name !== EXPIRE_ORDERS_JOB) return;

    const count = await this.booking.expirePendingOrders();
    if (count > 0) this.logger.log(`Expired ${count} pending orders`);
  }
}