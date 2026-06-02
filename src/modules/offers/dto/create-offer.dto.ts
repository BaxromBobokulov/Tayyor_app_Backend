import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDecimal,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Condition } from '@prisma/client';
import { Transform } from 'class-transformer';

export class CreateOfferDto {
  @ApiProperty({ example: 250000, description: 'Narx (UZS)' })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: 'UZS', default: 'UZS' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ enum: Condition, default: Condition.NEW })
  @IsOptional()
  @IsEnum(Condition)
  condition?: Condition;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  delivery?: boolean;

  @ApiPropertyOptional({ example: '1-2 kun' })
  @IsOptional()
  @IsString()
  deliveryTime?: string;

  @ApiPropertyOptional({ example: 'Original qism, yangi' })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({ example: '6 oy kafolat' })
  @IsOptional()
  @IsString()
  warranty?: string;

  @ApiProperty({ example: 1, description: 'Request ID' })
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  requestId: number;
}
