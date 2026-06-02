import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import * as admin from 'firebase-admin';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    if (!admin.apps.length) {
      try {
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
          ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
          : null;

        if (serviceAccount) {
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
          });
          this.logger.log('Firebase Admin initialized');
        } else {
          this.logger.warn('FIREBASE_SERVICE_ACCOUNT not set — FCM disabled');
        }
      } catch (e) {
        this.logger.error('Firebase init error', e);
      }
    }
  }

  async sendNotification(
    userId: number,
    title: string,
    body: string,
    type: NotificationType,
    data?: Record<string, any>,
  ) {
    // 1. DB ga saqlash
    const notification = await this.prisma.notification.create({
      data: { title, body, type, data: data ?? {}, userId },
    });

    // 2. FCM yuborish (agar token bo'lsa)
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true },
    });

    if (user?.fcmToken && admin.apps.length) {
      try {
        await admin.messaging().send({
          token: user.fcmToken,
          notification: { title, body },
          data: data ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])) : {},
        });
      } catch (e) {
        this.logger.warn(`FCM yuborishda xato (userId: ${userId}): ${e.message}`);
      }
    }

    return notification;
  }

  async getMyNotifications(userId: number, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]);
    return { notifications, total, page, limit };
  }

  async markAsRead(id: number, userId: number) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: number) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { message: 'Barcha bildirishnomalar o\'qildi deb belgilandi' };
  }

  async remove(id: number, userId: number) {
    await this.prisma.notification.deleteMany({ where: { id, userId } });
    return { message: 'Bildirishnoma o\'chirildi' };
  }
}
