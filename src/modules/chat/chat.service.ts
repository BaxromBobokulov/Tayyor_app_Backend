import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // Driver uchun — so'rovga tegishli barcha chatlar
  async getChatsByRequest(requestId: number, userId: number) {
    const request = await this.prisma.request.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException("So'rov topilmadi");
    if (request.driverId !== userId)
      throw new ForbiddenException("Bu so'rov sizga tegishli emas");

    const chats = await this.prisma.chat.findMany({
      where: { requestId },
      include: {
        offer: {
          include: {
            shop: {
              select: { id: true, name: true, phoneNumber: true, rating: true },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Oxirgi xabar preview uchun
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { chats };
  }

  // Barcha shaxsiy chatlar ro'yxati (ChatListPage uchun)
  async getMyChats(userId: number) {
    const chats = await this.prisma.chat.findMany({
      where: {
        OR: [
          { request: { driverId: userId } },
          { offer: { shop: { ownerId: userId } } }
        ]
      },
      include: {
        request: { select: { id: true, carModel: true, partName: true } },
        offer: {
          include: {
            shop: { select: { id: true, name: true, logoUrl: true } }
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return { chats };
  }

  // Chat tarixini olish (pagination bilan)
  async getMessages(chatId: number, userId: number, page = 1, limit = 30) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        request: { select: { driverId: true } },
        offer: {
          include: { shop: { select: { ownerId: true } } },
        },
      },
    });
    if (!chat) throw new NotFoundException('Chat topilmadi');

    // Faqat ikki kishi kirishi mumkin: Driver + Shop Owner
    const driverId = chat.request.driverId;
    const shopOwnerId = chat.offer?.shop?.ownerId;
    
    if (userId !== driverId && userId !== shopOwnerId) {
      console.log(`[ChatAccess] Denied: User ${userId} tried to access Chat ${chatId}. Participants: Driver ${driverId}, ShopOwner ${shopOwnerId}`);
      throw new ForbiddenException('Bu chatga kirishingizga ruxsat yo\'q');
    }

    const skip = (page - 1) * limit;
    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { chatId },
        include: {
          sender: { select: { id: true, fullName: true, avatarUrl: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.message.count({ where: { chatId } }),
    ]);

    return { messages: messages.reverse(), total, page, limit };
  }

  // WebSocket dan chaqiriladi — xabar saqlash
  async saveMessage(chatId: number, senderId: number, text?: string, imageUrl?: string) {
    if (!text && !imageUrl) {
      throw new BadRequestException('text yoki imageUrl bo\'lishi kerak');
    }

    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        request: { select: { driverId: true } },
        offer: {
          include: { shop: { select: { ownerId: true } } },
        },
      },
    });
    if (!chat) throw new NotFoundException('Chat topilmadi');

    const driverId = chat.request.driverId;
    const shopOwnerId = chat.offer?.shop?.ownerId;

    if (senderId !== driverId && senderId !== shopOwnerId) {
      throw new ForbiddenException('Bu chatga xabar yuborishingizga ruxsat yo\'q');
    }

    const message = await this.prisma.message.create({
      data: { chatId, senderId, text, imageUrl },
      include: {
        sender: { select: { id: true, fullName: true, avatarUrl: true, role: true } },
      },
    });

    // Receiver uchun FCM notification (offline bo'lsa)
    const receiverId = senderId === driverId ? shopOwnerId : driverId;
    if (receiverId) {
      await this.notifications.sendNotification(
        receiverId,
        'Yangi xabar',
        text || '📷 Rasm',
        NotificationType.NEW_MESSAGE,
        { chatId, messageId: message.id },
      );
    }

    return message;
  }

  // Chatdagi barcha xabarlarni o'qildi deb belgilash
  async markAsRead(chatId: number, userId: number) {
    await this.prisma.message.updateMany({
      where: { chatId, senderId: { not: userId }, isRead: false },
      data: { isRead: true },
    });
    return { success: true };
  }

  // Chat participants tekshirish (Gateway uchun)
  async checkAccess(chatId: number, userId: number): Promise<boolean> {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        request: { select: { driverId: true } },
        offer: {
          include: { shop: { select: { ownerId: true } } },
        },
      },
    });
    if (!chat) return false;

    const driverId = chat.request.driverId;
    const shopOwnerId = chat.offer?.shop?.ownerId;
    return userId === driverId || userId === shopOwnerId;
  }
}
