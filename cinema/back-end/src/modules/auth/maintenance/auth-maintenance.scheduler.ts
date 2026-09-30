// src/modules/auth/maintenance/auth-maintenance.scheduler.ts
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import {
  AUTH_MAINTENANCE_QUEUE,
  CLEANUP_REFRESH_TOKENS_JOB,
} from '../../../common/constants/auth.constants';

@Injectable()
export class AuthMaintenanceScheduler implements OnModuleInit {
  constructor(@InjectQueue(AUTH_MAINTENANCE_QUEUE) private queue: Queue) {}

  async onModuleInit() {
    await this.queue.upsertJobScheduler(
      CLEANUP_REFRESH_TOKENS_JOB,
      { pattern: '0 3 * * *' },
      {
        name: CLEANUP_REFRESH_TOKENS_JOB,
        opts: { removeOnComplete: 10, removeOnFail: 50 },
      },
    );
  }
}