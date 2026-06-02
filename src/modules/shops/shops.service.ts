import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';

@Injectable()
export class ShopsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(ownerId: number, dto: CreateShopDto) {
    const existing = await this.prisma.shop.findUnique({ where: { ownerId } });
    if (existing) throw new ConflictException("Sizda allaqachon do'kon mavjud");

    const shop = await this.prisma.shop.create({
      data: { ...dto, ownerId },
    });
    return { message: "Do'kon muvaffaqiyatli yaratildi", shop };
  }

  async findAll(query: {
    category?: string;
    brand?: string;
    isVerified?: string;
    page?: string;
    limit?: string;
  }) {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.category) where.categories = { has: query.category };
    if (query.brand) where.brands = { has: query.brand };
    if (query.isVerified !== undefined) where.isVerified = query.isVerified === 'true';

    const [shops, total] = await Promise.all([
      this.prisma.shop.findMany({
        where,
        skip,
        take: limit,
        include: { owner: { select: { id: true, fullName: true, phoneNumber: true } } },
        orderBy: { rating: 'desc' },
      }),
      this.prisma.shop.count({ where }),
    ]);

    return { shops, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number) {
    const shop = await this.prisma.shop.findUnique({
      where: { id },
      include: { owner: { select: { id: true, fullName: true, phoneNumber: true } } },
    });
    if (!shop) throw new NotFoundException("Do'kon topilmadi");
    return { shop };
  }

  async findNearby(lat: number, lng: number, radius: number = 10) {
    // 6371 - Yer radiusi (km)
    // Haversine formula
    const shops = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM (
        SELECT *,
          (6371 * acos(
            cos(radians(${lat})) * cos(radians(lat))
            * cos(radians(lng) - radians(${lng}))
            + sin(radians(${lat})) * sin(radians(lat))
          )) AS distance
        FROM "Shop"
        WHERE lat IS NOT NULL AND lng IS NOT NULL
      ) AS subquery
      WHERE distance < ${radius}
      ORDER BY distance
      LIMIT 50
    `;
    return { shops };
  }

  async update(id: number, userId: number, dto: UpdateShopDto) {
    const shop = await this.prisma.shop.findUnique({ where: { id } });
    if (!shop) throw new NotFoundException("Do'kon topilmadi");
    if (shop.ownerId !== userId) throw new ForbiddenException("Bu do'kon sizga tegishli emas");

    const updated = await this.prisma.shop.update({ where: { id }, data: dto });
    return { message: "Do'kon yangilandi", shop: updated };
  }

  async remove(id: number, userId: number, userRole: string) {
    const shop = await this.prisma.shop.findUnique({ where: { id } });
    if (!shop) throw new NotFoundException("Do'kon topilmadi");
    if (shop.ownerId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException("Bu do'konni o'chirishga huquqingiz yo'q");
    }
    await this.prisma.shop.delete({ where: { id } });
    return { message: "Do'kon o'chirildi" };
  }

  async getReviews(shopId: number) {
    const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) throw new NotFoundException("Do'kon topilmadi");

    const reviews = await this.prisma.review.findMany({
      where: { shopId },
      include: {
        author: { select: { id: true, fullName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { reviews };
  }
}
