import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { PrismaService } from 'src/core/database/prisma.service';
import { LoginAuthDto } from './dto/login-dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private async generateTokens(userId: number, role: string) {
    const payload = { id: userId, role };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET || process.env.SECRET || 'access_secret',
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || process.env.SECRET || 'refresh_secret',
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  async register(payload: CreateAuthDto) {
    const checkPhone = await this.prisma.user.findUnique({
      where: { phoneNumber: payload.phoneNumber },
    });
    if (checkPhone) {
      throw new ConflictException('Bu telefon raqami allaqachon mavjud');
    }

    const hashedPassword = await bcrypt.hash(payload.password, 10);

    const createdUser = await this.prisma.user.create({
      data: { ...payload, password: hashedPassword },
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

    const { accessToken, refreshToken } = await this.generateTokens(createdUser.id, createdUser.role);
    const hashedRefresh = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: createdUser.id },
      data: { refreshToken: hashedRefresh },
    });

    return {
      message: "Muvaffaqiyatli ro'yxatdan o'tildi",
      user: createdUser,
      accessToken,
      refreshToken,
    };
  }

  async login(payload: LoginAuthDto) {
    const user = await this.prisma.user.findUnique({
      where: { phoneNumber: payload.phoneNumber },
    });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');
    if (!user.isActive) throw new UnauthorizedException('Hisob faolsizlantirilgan');
    if (user.isBlocked) throw new UnauthorizedException("Hisob bloklangan. Admin bilan bog'laning");

    const isMatch = await bcrypt.compare(payload.password, user.password);
    if (!isMatch) throw new BadRequestException("Noto'g'ri parol");

    const { accessToken, refreshToken } = await this.generateTokens(user.id, user.role);
    const hashedRefresh = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefresh },
    });

    return {
      message: 'Muvaffaqiyatli login qilindi',
      accessToken,
      refreshToken,
    };
  }

  async refresh(user: any) {
    const { accessToken, refreshToken } = await this.generateTokens(user.id, user.role);
    const hashedRefresh = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefresh },
    });

    return {
      message: 'Tokenlar yangilandi',
      accessToken,
      refreshToken,
    };
  }

  async refreshByToken(refreshToken: string) {
    let payload: { id: number; role: string };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || process.env.SECRET || 'refresh_secret',
      });
    } catch {
      throw new UnauthorizedException("Refresh token yaroqsiz yoki muddati o'tgan");
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.id } });
    if (!user || !user.refreshToken) throw new UnauthorizedException('Foydalanuvchi topilmadi');

    const isMatch = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isMatch) throw new UnauthorizedException("Noto'g'ri refresh token");

    return this.refresh(user);
  }

  async logout(userId: number) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
    return { message: "Muvaffaqiyatli chiqildi" };
  }

  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        phoneNumber: true,
        role: true,
        avatarUrl: true,
        isActive: true,
        isBlocked: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            requests: true,
            sentMessages: true,
            reviewsGiven: true,
          },
        },
      },
    });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');
    return { user };
  }
}
