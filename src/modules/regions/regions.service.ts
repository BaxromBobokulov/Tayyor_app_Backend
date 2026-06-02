import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class RegionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const regions = await this.prisma.region.findMany({
      orderBy: { name: 'asc' },
    });
    return { regions };
  }

  async create(name: string) {
    const region = await this.prisma.region.create({
      data: { name },
    });
    return { message: 'Hudud muvaffaqiyatli qo\'shildi', region };
  }

  async remove(id: number) {
    const region = await this.prisma.region.findUnique({ where: { id } });
    if (!region) throw new NotFoundException('Hudud topilmadi');
    await this.prisma.region.delete({ where: { id } });
    return { message: 'Hudud o\'chirildi' };
  }
}
