import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';

import { PrismaModule } from './core/database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { ShopsModule } from './modules/shops/shops.module';
import { RequestsModule } from './modules/requests/requests.module';
import { OffersModule } from './modules/offers/offers.module';
import { ChatModule } from './modules/chat/chat.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { UploadModule } from './modules/upload/upload.module';
import { RegionsModule } from './modules/regions/regions.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    // Config — global
    ConfigModule.forRoot({ isGlobal: true }),

    // Rate Limiting — har bir IP uchun 60s da max 100 so'rov
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    // Cron jobs uchun
    ScheduleModule.forRoot(),

    // Database
    PrismaModule,

    // Feature modules
    AuthModule,
    UserModule,
    ShopsModule,
    RequestsModule,
    OffersModule,
    ChatModule,
    NotificationsModule,
    UploadModule,
    RegionsModule,
    AdminModule,
  ],
})
export class AppModule {}
