// src/modules/booking/maintenance/booking-maintenance.scheduler.ts
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import { BOOKING_MAINTENANCE_QUEUE, EXPIRE_ORDERS_JOB } from '../booking.constants';

@Injectable()
export class BookingMaintenanceScheduler implements OnModuleInit {
  constructor(@InjectQueue(BOOKING_MAINTENANCE_QUEUE) private queue: Queue) {}

  async onModuleInit() {
    await this.queue.upsertJobScheduler(
      EXPIRE_ORDERS_JOB,
      { every: 60_000 },
      {
        name: EXPIRE_ORDERS_JOB,
        opts: { removeOnComplete: 10, removeOnFail: 50 },
      },
    );
  }
}