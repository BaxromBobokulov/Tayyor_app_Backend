import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/core/database/prisma.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class RequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(driverId: number, dto: CreateRequestDto) {
    const { imageUrls, ...rest } = dto;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 3); // 3 kundan keyin

    const request = await this.prisma.request.create({
      data: {
        ...rest,
        driverId,
        expiresAt,
        images: imageUrls?.length
          ? { create: imageUrls.map((url) => ({ url })) }
          : undefined,
      },
      include: { images: true, region: true },
    });

    return { message: 'So\'rov muvaffaqiyatli yaratildi', request };
  }

  async findAll(query: {
    carModel?: string;
    partName?: string;
    regionId?: string;
    status?: string;
    page?: string;
    limit?: string;
  }) {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.carModel) where.carModel = { contains: query.carModel, mode: 'insensitive' };
    if (query.partName) where.partName = { contains: query.partName, mode: 'insensitive' };
    if (query.regionId) where.regionId = parseInt(query.regionId);
    if (query.status) where.status = query.status;
    else where.status = 'OPEN'; // default faqat OPEN ko'rinadi

    const [requests, total] = await Promise.all([
      this.prisma.request.findMany({
        where,
        skip,
        take: limit,
        include: {
          images: true,
          region: true,
          driver: { select: { id: true, fullName: true } },
          _count: { select: { offers: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.request.count({ where }),
    ]);

    return { requests, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findMy(driverId: number) {
    const requests = await this.prisma.request.findMany({
      where: { driverId },
      include: {
        images: true,
        region: true,
        _count: { select: { offers: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { requests };
  }

  async findOne(id: number) {
    const request = await this.prisma.request.findUnique({
      where: { id },
      include: {
        images: true,
        region: true,
        driver: { select: { id: true, fullName: true, phoneNumber: true } },
        _count: { select: { offers: true } },
      },
    });
    if (!request) throw new NotFoundException('So\'rov topilmadi');

    // viewCount ++
    await this.prisma.request.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return { request };
  }

  async update(id: number, userId: number, dto: UpdateRequestDto) {
    const request = await this.prisma.request.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('So\'rov topilmadi');
    if (request.driverId !== userId) throw new ForbiddenException('Bu so\'rov sizga tegishli emas');
    if (request.status !== 'OPEN') throw new BadRequestException('Faqat OPEN statusdagi so\'rovni tahrirlash mumkin');

    const updated = await this.prisma.request.update({
      where: { id },
      data: dto,
      include: { images: true, region: true },
    });
    return { message: 'So\'rov yangilandi', request: updated };
  }

  async remove(id: number, userId: number, userRole: string) {
    const request = await this.prisma.request.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('So\'rov topilmadi');
    if (request.driverId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('Bu so\'rovni o\'chirishga huquqingiz yo\'q');
    }
    await this.prisma.request.delete({ where: { id } });
    return { message: 'So\'rov o\'chirildi' };
  }

  async cancel(id: number, userId: number) {
    const request = await this.prisma.request.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('So\'rov topilmadi');
    if (request.driverId !== userId) throw new ForbiddenException('Bu so\'rov sizga tegishli emas');
    if (request.status === 'CLOSED' || request.status === 'CANCELLED') {
      throw new BadRequestException('So\'rov allaqachon yopilgan yoki bekor qilingan');
    }

    const updated = await this.prisma.request.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
    return { message: 'So\'rov bekor qilindi', request: updated };
  }

  // Har kecha 00:00 da ishlaydi
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async expireOldRequests() {
    const expired = await this.prisma.request.findMany({
      where: {
        status: 'OPEN',
        expiresAt: { lte: new Date() },
      },
      select: { id: true, driverId: true },
    });

    if (expired.length === 0) return;

    await this.prisma.request.updateMany({
      where: { id: { in: expired.map((r) => r.id) } },
      data: { status: 'EXPIRED' },
    });

    // Har bir driverga notification yuborish
    for (const req of expired) {
      await this.notifications.sendNotification(
        req.driverId,
        'So\'rovingiz muddati tugadi',
        'Sizning so\'rovingiz avtomatik ravishda EXPIRED deb belgilandi.',
        NotificationType.REQUEST_EXPIRED,
        { requestId: req.id },
      );
    }
  }
}
