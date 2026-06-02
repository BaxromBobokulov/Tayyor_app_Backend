import { IsString, IsOptional, IsArray, IsBoolean, IsNumber, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateShopDto {
  @ApiProperty({ example: 'Ali Motors' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ required: false, example: 'Avtomobil ehtiyot qismlari do\'koni' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'Toshkent, Chilonzor tumani' })
  @IsString()
  address: string;

  @ApiProperty({ required: false, example: 41.2995 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  lat?: number;

  @ApiProperty({ required: false, example: 69.2401 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  lng?: number;

  @ApiProperty({ example: '+998901234567' })
  @IsString()
  phoneNumber: string;

  @ApiProperty({ required: false, example: '09:00-18:00' })
  @IsOptional()
  @IsString()
  workingHours?: string;

  @ApiProperty({ required: false, example: '@ali_motors' })
  @IsOptional()
  @IsString()
  telegram?: string;

  @ApiProperty({ example: ['Dvigatel', 'Tormoz'] })
  @IsArray()
  @IsString({ each: true })
  categories: string[];

  @ApiProperty({ example: ['Toyota', 'BMW'] })
  @IsArray()
  @IsString({ each: true })
  brands: string[];

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isOpen?: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  logoUrl?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  bannerUrl?: string;
}
