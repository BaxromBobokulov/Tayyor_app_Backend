import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { OffersService } from './offers.service';
import { CreateOfferDto } from './dto/create-offer.dto';

@ApiTags('Offers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('offers')
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Post()
  @Roles(Role.SHOP)
  @ApiOperation({ summary: 'Taklif berish [SHOP]' })
  create(@CurrentUser() user: any, @Body() dto: CreateOfferDto) {
    return this.offersService.create(user.id, dto);
  }

  @Get('request/:requestId')
  @Roles(Role.DRIVER)
  @ApiOperation({ summary: "So'rovga kelgan takliflar [DRIVER - o'z so'rovi]" })
  @ApiParam({ name: 'requestId', type: Number })
  getByRequest(
    @Param('requestId', ParseIntPipe) requestId: number,
    @CurrentUser() user: any,
  ) {
    return this.offersService.getByRequest(requestId, user.id);
  }

  @Get('my')
  @Roles(Role.SHOP)
  @ApiOperation({ summary: "Mening takliflarim [SHOP]" })
  getMyOffers(@CurrentUser() user: any) {
    return this.offersService.getMyOffers(user.id);
  }

  @Patch(':id/accept')
  @Roles(Role.DRIVER)
  @ApiOperation({ summary: 'Taklifni qabul qilish [DRIVER]' })
  @ApiParam({ name: 'id', type: Number })
  accept(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.offersService.accept(id, user.id);
  }

  @Patch(':id/reject')
  @Roles(Role.DRIVER)
  @ApiOperation({ summary: 'Taklifni rad etish [DRIVER]' })
  @ApiParam({ name: 'id', type: Number })
  reject(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.offersService.reject(id, user.id);
  }

  @Patch(':id/withdraw')
  @Roles(Role.SHOP)
  @ApiOperation({ summary: 'Taklifni qaytarib olish [SHOP]' })
  @ApiParam({ name: 'id', type: Number })
  withdraw(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.offersService.withdraw(id, user.id);
  }
}
