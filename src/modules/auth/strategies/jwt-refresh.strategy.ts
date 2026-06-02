import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from 'src/core/database/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      secretOrKey: process.env.JWT_REFRESH_SECRET || process.env.SECRET || 'refresh_secret',
      ignoreExpiration: false,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: { id: number; role: string }) {
    const refreshToken: string = req.body?.refreshToken;
    if (!refreshToken) throw new UnauthorizedException('Refresh token topilmadi');

    const user = await this.prisma.user.findUnique({ where: { id: payload.id } });
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Foydalanuvchi topilmadi yoki logout qilingan');
    }

    const isMatch = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isMatch) throw new UnauthorizedException("Noto'g'ri refresh token");

    return { ...user, refreshToken };
  }
}
