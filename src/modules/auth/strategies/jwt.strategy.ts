import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_ACCESS_SECRET || process.env.SECRET || 'access_secret',
      ignoreExpiration: false,
    });
  }

  async validate(payload: { id: number; role: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.id },
    });
    if (!user || !user.isActive || user.isBlocked) {
      throw new UnauthorizedException('Foydalanuvchi topilmadi yoki bloklangan');
    }
    return user;
  }
}
