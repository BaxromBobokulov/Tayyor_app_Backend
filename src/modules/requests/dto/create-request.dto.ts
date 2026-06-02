import {
  IsString, IsOptional, IsNumber, IsArray, Min, Max, IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Urgency } from '@prisma/client';

export class CreateRequestDto {
  @ApiProperty({ example: 'Toyota Camry' })
  @IsString()
  carModel: string;

  @ApiProperty({ example: 2018 })
  @IsNumber()
  @Type(() => Number)
  carYear: number;

  @ApiProperty({ required: false, example: 'Sedan' })
  @IsOptional()
  @IsString()
  carBody?: string;

  @ApiProperty({ required: false, example: 'JTD123456' })
  @IsOptional()
  @IsString()
  vinCode?: string;

  @ApiProperty({ example: 'Tormoz disk' })
  @IsString()
  partName: string;

  @ApiProperty({ required: false, example: 'TK-2345' })
  @IsOptional()
  @IsString()
  partNumber?: string;

  @ApiProperty({ required: false, example: 'Oldingi o\'ng tormoz' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  regionId?: number;

  @ApiProperty({ required: false, enum: Urgency, example: Urgency.NORMAL })
  @IsOptional()
  @IsEnum(Urgency)
  urgency?: Urgency;

  @ApiProperty({ required: false, example: '/uploads/voice-123.webm' })
  @IsOptional()
  @IsString()
  voiceUrl?: string;

  @ApiProperty({ required: false, type: [String], description: 'Rasm URL lari' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];
}
