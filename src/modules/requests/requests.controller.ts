import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards, ParseIntPipe, UseInterceptors, UploadedFiles
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';

@ApiTags('Requests')
@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @ApiOperation({ summary: 'So\'rov yaratish [DRIVER]' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        carModel: { type: 'string', example: 'Toyota Camry' },
        carYear: { type: 'number', example: 2018 },
        carBody: { type: 'string', example: 'Sedan' },
        vinCode: { type: 'string', example: 'JTD123456' },
        partName: { type: 'string', example: 'Tormoz disk' },
        partNumber: { type: 'string', example: 'TK-2345' },
        description: { type: 'string', example: 'Oldingi o\'ng tormoz' },
        regionId: { type: 'number', example: 1 },
        urgency: { type: 'string', example: 'NORMAL', enum: ['NORMAL', 'TODAY', 'URGENT'] },
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary'
          },
          description: "So'rov uchun rasmlar (max 5)"
        },
        voice: {
          type: 'string',
          format: 'binary',
          description: "Ovozli xabar"
        }
      }
    }
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'images', maxCount: 5 },
      { name: 'voice', maxCount: 1 },
    ], {
      storage: diskStorage({
        destination: 'src/uploads',
        filename: (req, file, cb) => {
          const filename = Date.now() + '-' + Math.round(Math.random() * 1E9) + '.' + file.mimetype.split('/')[1];
          cb(null, filename);
        },
      }),
    }),
  )
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DRIVER')
  @Post()
  create(
    @CurrentUser() user: any,
    @Body() dto: CreateRequestDto,
    @UploadedFiles() files: { images?: Express.Multer.File[], voice?: Express.Multer.File[] }
  ) {
    if (files.images && files.images.length > 0) {
      dto.imageUrls = files.images.map(file => `/uploads/${file.filename}`);
    }
    if (files.voice && files.voice.length > 0) {
      dto.voiceUrl = `/uploads/${files.voice[0].filename}`;
    }
    return this.requestsService.create(user.id, dto);
  }

  @ApiOperation({ summary: 'Barcha so\'rovlar [SHOP ko\'radi]' })
  @ApiQuery({ name: 'carModel', required: false })
  @ApiQuery({ name: 'partName', required: false })
  @ApiQuery({ name: 'regionId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @Get()
  findAll(@Query() query: any) {
    return this.requestsService.findAll(query);
  }

  @ApiOperation({ summary: 'O\'z so\'rovlarim [DRIVER]' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DRIVER')
  @Get('my')
  findMy(@CurrentUser() user: any) {
    return this.requestsService.findMy(user.id);
  }

  @ApiOperation({ summary: 'Bitta so\'rov (viewCount++)' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.requestsService.findOne(id);
  }

  @ApiOperation({ summary: 'So\'rovni tahrirlash [O\'z so\'rovi, OPEN]' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Body() dto: UpdateRequestDto,
  ) {
    return this.requestsService.update(id, user.id, dto);
  }

  @ApiOperation({ summary: 'Bekor qilish [DRIVER]' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DRIVER')
  @Patch(':id/cancel')
  cancel(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.requestsService.cancel(id, user.id);
  }

  @ApiOperation({ summary: 'O\'chirish [O\'z so\'rovi yoki ADMIN]' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.requestsService.remove(id, user.id, user.role);
  }
}
