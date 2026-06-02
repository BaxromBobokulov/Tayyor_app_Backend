import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { NotificationType, OfferStatus, RequestStatus } from '@prisma/client';

@Injectable()
export class OffersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(shopOwnerId: number, dto: CreateOfferDto) {
    // Shop mavjudligini tekshirish
    const shop = await this.prisma.shop.findUnique({
      where: { ownerId: shopOwnerId },
    });
    if (!shop) throw new NotFoundException("Do'kon topilmadi. Avval do'kon oching.");

    // Request mavjudligini tekshirish
    const request = await this.prisma.request.findUnique({
      where: { id: dto.requestId },
    });
    if (!request) throw new NotFoundException("So'rov topilmadi");
    if (request.status === RequestStatus.CLOSED || request.status === RequestStatus.CANCELLED) {
      throw new BadRequestException("Bu so'rov yopilgan yoki bekor qilingan");
    }

    // Bir do'kon bitta requestga faqat 1 ta offer bera oladi
    const existing = await this.prisma.offer.findFirst({
      where: { shopId: shop.id, requestId: dto.requestId },
    });
    if (existing) throw new ConflictException("Siz bu so'rovga allaqachon taklif bergansiz");

    // Tranzaksiyada offer va chat yaratish
    const result = await this.prisma.$transaction(async (tx) => {
      const offer = await tx.offer.create({
        data: {
          price: dto.price,
          currency: dto.currency ?? 'UZS',
          condition: dto.condition,
          delivery: dto.delivery ?? false,
          deliveryTime: dto.deliveryTime,
          comment: dto.comment,
          warranty: dto.warranty,
          requestId: dto.requestId,
          shopId: shop.id,
        },
        include: { shop: true, request: true },
      });

      // Chat avtomatik yaratiladi
      await tx.chat.create({
        data: {
          requestId: dto.requestId,
          offerId: offer.id,
        },
      });

      // Agar birinchi offer bo'lsa — request statusni IN_PROGRESS ga o'tkazish
      const offerCount = await tx.offer.count({ where: { requestId: dto.requestId } });
      if (offerCount === 1) {
        await tx.request.update({
          where: { id: dto.requestId },
          data: { status: RequestStatus.IN_PROGRESS },
        });
      }

      return offer;
    });

    // Driver ga notification yuborish
    await this.notifications.sendNotification(
      request.driverId,
      'Yangi taklif keldi!',
      `${result.shop.name} do'koni sizning so'rovingizga ${result.price} ${result.currency} narxda taklif berdi.`,
      NotificationType.NEW_OFFER,
      { offerId: result.id, requestId: dto.requestId },
    );

    return { message: 'Taklif muvaffaqiyatli yuborildi', offer: result };
  }

  async getByRequest(requestId: number, driverId: number) {
    const request = await this.prisma.request.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException("So'rov topilmadi");
    if (request.driverId !== driverId) throw new ForbiddenException("Bu so'rov sizga tegishli emas");

    const offers = await this.prisma.offer.findMany({
      where: { requestId },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            address: true,
            phoneNumber: true,
            rating: true,
            reviewCount: true,
            isVerified: true,
          },
        },
        chat: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { offers };
  }

  async getMyOffers(shopOwnerId: number) {
    const shop = await this.prisma.shop.findUnique({ where: { ownerId: shopOwnerId } });
    if (!shop) throw new NotFoundException("Do'kon topilmadi");

    const offers = await this.prisma.offer.findMany({
      where: { shopId: shop.id },
      include: {
        request: {
          include: { images: true, region: true },
        },
        chat: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { offers };
  }

  async accept(offerId: number, driverId: number) {
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
      include: { request: true, shop: true },
    });
    if (!offer) throw new NotFoundException('Taklif topilmadi');
    if (offer.request.driverId !== driverId)
      throw new ForbiddenException("Bu so'rov sizga tegishli emas");
    if (offer.status !== OfferStatus.PENDING)
      throw new BadRequestException('Bu taklif allaqachon javob berilgan');

    // Tranzaksiyada qabul qilish
    await this.prisma.$transaction(async (tx) => {
      // Qabul qilingan offer
      await tx.offer.update({
        where: { id: offerId },
        data: { status: OfferStatus.ACCEPTED },
      });

      // Request yopiladi va acceptedOfferId belgilanadi
      await tx.request.update({
        where: { id: offer.requestId },
        data: {
          status: RequestStatus.CLOSED,
          acceptedOfferId: offerId,
        },
      });

      // Qolgan offerlar rejected bo'ladi
      await tx.offer.updateMany({
        where: {
          requestId: offer.requestId,
          id: { not: offerId },
          status: OfferStatus.PENDING,
        },
        data: { status: OfferStatus.REJECTED },
      });
    });

    // Shop ga notification
    await this.notifications.sendNotification(
      offer.shop.ownerId,
      'Taklifingiz qabul qilindi! 🎉',
      `Haydovchi sizning taklifingizni qabul qildi. Do'koningiz bilan bog'lanish uchun chat oching.`,
      NotificationType.OFFER_ACCEPTED,
      { offerId, requestId: offer.requestId },
    );

    return { message: 'Taklif qabul qilindi, so\'rov yopildi' };
  }

  async reject(offerId: number, driverId: number) {
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
      include: { request: true, shop: true },
    });
    if (!offer) throw new NotFoundException('Taklif topilmadi');
    if (offer.request.driverId !== driverId)
      throw new ForbiddenException("Bu so'rov sizga tegishli emas");
    if (offer.status !== OfferStatus.PENDING)
      throw new BadRequestException('Bu taklif allaqachon javob berilgan');

    await this.prisma.offer.update({
      where: { id: offerId },
      data: { status: OfferStatus.REJECTED },
    });

    // Shop ga notification
    await this.notifications.sendNotification(
      offer.shop.ownerId,
      'Taklifingiz rad etildi',
      `Haydovchi sizning taklifingizni rad etdi.`,
      NotificationType.OFFER_REJECTED,
      { offerId, requestId: offer.requestId },
    );

    return { message: 'Taklif rad etildi' };
  }

  async withdraw(offerId: number, shopOwnerId: number) {
    const shop = await this.prisma.shop.findUnique({ where: { ownerId: shopOwnerId } });
    if (!shop) throw new NotFoundException("Do'kon topilmadi");

    const offer = await this.prisma.offer.findUnique({ where: { id: offerId } });
    if (!offer) throw new NotFoundException('Taklif topilmadi');
    if (offer.shopId !== shop.id)
      throw new ForbiddenException('Bu taklif sizga tegishli emas');
    if (offer.status !== OfferStatus.PENDING)
      throw new BadRequestException('Bu taklif allaqachon javob berilgan');

    await this.prisma.offer.update({
      where: { id: offerId },
      data: { status: OfferStatus.WITHDRAWN },
    });

    return { message: 'Taklif qaytarib olindi' };
  }
}
