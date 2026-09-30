// src/modules/auth/auth.module.ts
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { AUTH_MAINTENANCE_QUEUE } from '../../common/constants/auth.constants';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthMaintenanceProcessor } from './maintenance/auth-maintenance.processor';
import { AuthMaintenanceScheduler } from './maintenance/auth-maintenance.scheduler';
import { TokensService } from './service/tokens.service';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({}),
    BullModule.registerQueue({ name: AUTH_MAINTENANCE_QUEUE }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokensService,
    AuthMaintenanceProcessor,
    AuthMaintenanceScheduler,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AuthModule {}