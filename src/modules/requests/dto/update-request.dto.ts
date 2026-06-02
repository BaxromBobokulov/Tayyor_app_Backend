import { IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateRequestDto } from './create-request.dto';

export class UpdateRequestDto extends PartialType(OmitType(CreateRequestDto, ['imageUrls'] as const)) {}

export class FilterRequestDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  carModel?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  partName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  regionId?: number;

  @ApiProperty({ required: false, enum: ['OPEN', 'IN_PROGRESS', 'CLOSED'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
