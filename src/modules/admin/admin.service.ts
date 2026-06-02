import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // ─── USERS ──────────────────────────────────────────────────────
  async getUsers(query: {
    role?: string;
    isBlocked?: string;
    search?: string;
    page?: string;
    limit?: string;
  }) {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.role) where.role = query.role;
    if (query.isBlocked !== undefined) where.isBlocked = query.isBlocked === 'true';
    if (query.search) {
      where.OR = [
        { fullName: { contains: query.search, mode: 'insensitive' } },
        { phoneNumber: { contains: query.search } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          fullName: true,
          phoneNumber: true,
          role: true,
          isActive: true,
          isBlocked: true,
          avatarUrl: true,
          createdAt: true,
          _count: { select: { requests: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async toggleBlock(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isBlocked: !user.isBlocked },
      select: { id: true, fullName: true, isBlocked: true },
    });

    return {
      message: updated.isBlocked
        ? 'Foydalanuvchi bloklandi'
        : 'Foydalanuvchi blokdan chiqarildi',
      user: updated,
    };
  }

  async deleteUser(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');
    await this.prisma.user.delete({ where: { id: userId } });
    return { message: "Foydalanuvchi o'chirildi" };
  }

  // ─── SHOPS ──────────────────────────────────────────────────────
  async getShops(query: {
    isVerified?: string;
    search?: string;
    page?: string;
    limit?: string;
  }) {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.isVerified !== undefined) where.isVerified = query.isVerified === 'true';
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { address: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [shops, total] = await Promise.all([
      this.prisma.shop.findMany({
        where,
        skip,
        take: limit,
        include: {
          owner: { select: { id: true, fullName: true, phoneNumber: true } },
          _count: { select: { offers: true, reviews: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.shop.count({ where }),
    ]);

    return { shops, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async toggleVerify(shopId: number) {
    const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) throw new NotFoundException("Do'kon topilmadi");

    const updated = await this.prisma.shop.update({
      where: { id: shopId },
      data: { isVerified: !shop.isVerified },
      select: { id: true, name: true, isVerified: true },
    });

    return {
      message: updated.isVerified
        ? "Do'kon tasdiqlandi ✅"
        : "Do'kon tasdiqlanmadi",
      shop: updated,
    };
  }

  // ─── REQUESTS ───────────────────────────────────────────────────
  async getRequests(query: {
    status?: string;
    page?: string;
    limit?: string;
  }) {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;

    const [requests, total] = await Promise.all([
      this.prisma.request.findMany({
        where,
        skip,
        take: limit,
        include: {
          driver: { select: { id: true, fullName: true, phoneNumber: true } },
          region: true,
          images: true,
          _count: { select: { offers: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.request.count({ where }),
    ]);

    return { requests, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ─── STATS ──────────────────────────────────────────────────────
  async getStats() {
    const [totalUsers, totalShops, totalRequests, totalOffers] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.shop.count(),
      this.prisma.request.count(),
      this.prisma.offer.count(),
    ]);

    const [openRequests, closedRequests, activeShops] = await Promise.all([
      this.prisma.request.count({ where: { status: 'OPEN' } }),
      this.prisma.request.count({ where: { status: 'CLOSED' } }),
      this.prisma.shop.count({ where: { isVerified: true } }),
    ]);

    return {
      stats: {
        totalUsers,
        totalShops,
        totalRequests,
        totalOffers,
        openRequests,
        closedRequests,
        verifiedShops: activeShops,
      },
    };
  }

  // ─── BROADCAST NOTIFICATION ─────────────────────────────────────
  async broadcastNotification(title: string, body: string) {
    const users = await this.prisma.user.findMany({
      where: { isActive: true, isBlocked: false },
      select: { id: true },
    });

    const results = await Promise.allSettled(
      users.map((u) =>
        this.notifications.sendNotification(u.id, title, body, NotificationType.SYSTEM),
      ),
    );

    const success = results.filter((r) => r.status === 'fulfilled').length;
    return {
      message: `${success}/${users.length} foydalanuvchiga notification yuborildi`,
    };
  }
}
