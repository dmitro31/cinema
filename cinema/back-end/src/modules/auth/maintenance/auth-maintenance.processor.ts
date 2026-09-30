// src/modules/auth/maintenance/auth-maintenance.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  AUTH_MAINTENANCE_QUEUE,
  CLEANUP_REFRESH_TOKENS_JOB,
} from '../../../common/constants/auth.constants';
import { PrismaService } from '../../../core/database/prisma.service';

@Processor(AUTH_MAINTENANCE_QUEUE)
export class AuthMaintenanceProcessor extends WorkerHost {
  private readonly logger = new Logger(AuthMaintenanceProcessor.name);

  constructor(private prisma: PrismaService) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name !== CLEANUP_REFRESH_TOKENS_JOB) return;

    const { count } = await this.prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    this.logger.log(`Removed ${count} expired refresh tokens`);
  }
}