import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/core/database/prisma.service';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) { }
  async create(payload: CreateUserDto) {

    const checkPhone = await this.prisma.user.findUnique({ where: { phoneNumber: payload.phoneNumber } });
    if (checkPhone) {
      throw new ConflictException("Bu telefon raqam allaqachon mavjud");
    }

    const hashPassword = await bcrypt.hash(payload.password, 12);
    const createdUser = await this.prisma.user.create({
      data: {
        ...payload,
        password: hashPassword
      },
      select: {
        id: true,
        fullName: true,
        phoneNumber: true,
        role: true,
        isActive: true,
        isBlocked: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    return {
      message: "Foydalanuvchi muvaffaqiyatli yaratildi",
      user: createdUser
    }
  }

  async findDriver() {
    const users = await this.prisma.user.findMany({
      where: {
        role: Role.DRIVER
      },
      select: {
        id: true,
        fullName: true,
        phoneNumber: true,
        role: true,
        isActive: true,
        isBlocked: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    return {
      users: users
    }
  }


  async findShop() {
    const users = await this.prisma.user.findMany({
      where: {
        role: Role.SHOP
      },
      select: {
        id: true,
        fullName: true,
        phoneNumber: true,
        role: true,
        isActive: true,
        isBlocked: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    return {
      users: users
    }
  }

  async findAdmin() {
    const users = await this.prisma.user.findMany({
      where: {
        role: Role.ADMIN
      },
      select: {
        id: true,
        fullName: true,
        phoneNumber: true,
        role: true,
        isActive: true,
        isBlocked: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    return {
      users: users
    }
  }

  
  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: id
      },
      select: {
        id: true,
        fullName: true,
        phoneNumber: true,
        role: true,
        isActive: true,
        isBlocked: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!user) {
      throw new NotFoundException("Foydalanuvchi topilmadi");
    }

    return {
      user: user
    }
  }

  async update(id: number, payload: UpdateUserDto) {
    await this.findOne(id); // user mavjudligini tekshirish

    // Faqat kiritilgan (undefined bo'lmagan) fieldlarni ajratib olamiz
    const dataToUpdate = Object.fromEntries(
      Object.entries(payload).filter(([_, value]) => value !== undefined)
    );

    // Hech narsa kiritilmagan bo'lsa
    if (Object.keys(dataToUpdate).length === 0) {
      throw new BadRequestException("Yangilash uchun kamida bitta maydon kiritilishi kerak");
    }

    // Telefon kiritilgan bo'lsagina tekshirish
    if (dataToUpdate.phoneNumber) {
      const checkPhone = await this.prisma.user.findUnique({
        where: { phoneNumber: dataToUpdate.phoneNumber },
      });
      if (checkPhone && checkPhone.id !== id) {
        throw new ConflictException("Bu telefon raqam allaqachon mavjud");
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        fullName: true,
        phoneNumber: true,
        role: true,
        isActive: true,
        isBlocked: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      message: "Foydalanuvchi muvaffaqiyatli yangilandi",
      user: updatedUser,
    };
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.user.update({
      where: {
        id: id
      },
      data: {
        isActive: false
      }
    });

    return {
      message: "Foydalanuvchi muvaffaqiyatli o'chirildi"
    }
  }
}
