import { Controller, Post, Get, Body, UseGuards, Request, HttpCode, HttpStatus, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginAuthDto } from './dto/login-dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: "Ro'yxatdan o'tish" })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        fullName: { type: 'string', example: 'Ali Valiyev' },
        phoneNumber: { type: 'string', example: '+998901234567' },
        password: { type: 'string', example: 'Password1!' },
        role: { type: 'string', example: 'DRIVER' },
        photo: { type: 'string', format: 'binary', description: 'Avatar rasmi' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: diskStorage({
        destination: 'src/uploads',
        filename: (req, file, cb) => {
          const filename = Date.now() + '.' + file.mimetype.split('/')[1];
          cb(null, filename);
        },
      }),
    }),
  )
  @Post('register')
  register(
    @Body() payload: CreateAuthDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (file) {
      payload.avatarUrl = `/uploads/${file.filename}`;
    }
    return this.authService.register(payload);
  }

  @ApiOperation({ summary: 'Kirish' })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() payload: LoginAuthDto) {
    return this.authService.login(payload);
  }

  @ApiOperation({ summary: 'Access tokenni yangilash' })
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  refresh(@Body() body: RefreshTokenDto, @Request() req: any) {
    // Strategy token ni req.user ga qo'yadi, lekin hozir manual ishlaydi
    return this.authService.refreshByToken(body.refreshToken);
  }

  @ApiOperation({ summary: 'Chiqish' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  logout(@CurrentUser() user: any) {
    return this.authService.logout(user.id);
  }

  @ApiOperation({ summary: 'Joriy foydalanuvchi' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@CurrentUser() user: any) {
    return this.authService.getMe(user.id);
  }
}
