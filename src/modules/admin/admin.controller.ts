import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { AdminService } from './admin.service';
import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class BroadcastDto {
  @ApiProperty({ example: 'Yangi funksiya!' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Ilovamizda yangi imkoniyatlar paydo bo\'ldi!' })
  @IsString()
  body: string;
}

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ─── USERS ─────────────────────────────────────────────────────
  @Get('users')
  @ApiOperation({ summary: "Barcha foydalanuvchilar [ADMIN]" })
  @ApiQuery({ name: 'role', required: false, enum: Role })
  @ApiQuery({ name: 'isBlocked', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getUsers(@Query() query: any) {
    return this.adminService.getUsers(query);
  }

  @Patch('users/:id/block')
  @ApiOperation({ summary: "Foydalanuvchini bloklash/blokdan chiqarish [ADMIN]" })
  @ApiParam({ name: 'id', type: Number })
  toggleBlock(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.toggleBlock(id);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: "Foydalanuvchini o'chirish [ADMIN]" })
  @ApiParam({ name: 'id', type: Number })
  deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteUser(id);
  }

  // ─── SHOPS ─────────────────────────────────────────────────────
  @Get('shops')
  @ApiOperation({ summary: "Barcha do'konlar [ADMIN]" })
  @ApiQuery({ name: 'isVerified', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getShops(@Query() query: any) {
    return this.adminService.getShops(query);
  }

  @Patch('shops/:id/verify')
  @ApiOperation({ summary: "Do'konni tasdiqlash/bekor qilish [ADMIN]" })
  @ApiParam({ name: 'id', type: Number })
  toggleVerify(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.toggleVerify(id);
  }

  // ─── REQUESTS ──────────────────────────────────────────────────
  @Get('requests')
  @ApiOperation({ summary: "Barcha so'rovlar [ADMIN]" })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getRequests(@Query() query: any) {
    return this.adminService.getRequests(query);
  }

  // ─── STATS ─────────────────────────────────────────────────────
  @Get('stats')
  @ApiOperation({ summary: 'Statistika [ADMIN]' })
  getStats() {
    return this.adminService.getStats();
  }

  // ─── BROADCAST ─────────────────────────────────────────────────
  @Post('notifications/broadcast')
  @ApiOperation({ summary: "Barcha foydalanuvchilarga notification yuborish [ADMIN]" })
  @ApiBody({ type: BroadcastDto })
  broadcast(@Body() dto: BroadcastDto) {
    return this.adminService.broadcastNotification(dto.title, dto.body);
  }
}
