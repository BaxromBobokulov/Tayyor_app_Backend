import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards, ParseIntPipe, UseInterceptors, UploadedFile
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { ShopsService } from './shops.service';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';

@ApiTags('Shops')
@Controller('shops')
export class ShopsController {
  constructor(private readonly shopsService: ShopsService) {}

  @ApiOperation({ summary: "Do'kon yaratish [SHOP]" })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Ali Motors' },
        description: { type: 'string', example: 'Zo\'r do\'kon' },
        address: { type: 'string', example: 'Chilonzor' },
        phoneNumber: { type: 'string', example: '+998901234567' },
        categories: { type: 'array', items: { type: 'string' } },
        brands: { type: 'array', items: { type: 'string' } },
        logo: { type: 'string', format: 'binary', description: "Do'kon logotipi" }
      }
    }
  })
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: diskStorage({
        destination: 'src/uploads',
        filename: (req, file, cb) => {
          const filename = Date.now() + '.' + file.mimetype.split('/')[1];
          cb(null, filename);
        },
      }),
    }),
  )
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SHOP')
  @Post()
  create(
    @CurrentUser() user: any,
    @Body() dto: CreateShopDto,
    @UploadedFile() file: Express.Multer.File
  ) {
    if (file) {
      dto.logoUrl = `/uploads/${file.filename}`;
    }
    return this.shopsService.create(user.id, dto);
  }

  @ApiOperation({ summary: "Barcha do'konlar" })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'brand', required: false })
  @ApiQuery({ name: 'isVerified', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @Get()
  findAll(@Query() query: any) {
    return this.shopsService.findAll(query);
  }

  @ApiOperation({ summary: "Yaqin atrofdagi do'konlar" })
  @ApiQuery({ name: 'lat', required: true })
  @ApiQuery({ name: 'lng', required: true })
  @ApiQuery({ name: 'radius', required: false, description: 'km (default: 10)' })
  @Get('nearby')
  findNearby(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius?: string,
  ) {
    return this.shopsService.findNearby(
      parseFloat(lat),
      parseFloat(lng),
      radius ? parseFloat(radius) : 10,
    );
  }

  @ApiOperation({ summary: "Bitta do'kon" })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.shopsService.findOne(id);
  }

  @ApiOperation({ summary: "Do'kon sharhlar" })
  @Get(':id/reviews')
  getReviews(@Param('id', ParseIntPipe) id: number) {
    return this.shopsService.getReviews(id);
  }

  @ApiOperation({ summary: "Do'konni tahrirlash [O'z do'koni]" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Body() dto: UpdateShopDto,
  ) {
    return this.shopsService.update(id, user.id, dto);
  }

  @ApiOperation({ summary: "Do'konni o'chirish [O'z do'koni yoki ADMIN]" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.shopsService.remove(id, user.id, user.role);
  }
}
