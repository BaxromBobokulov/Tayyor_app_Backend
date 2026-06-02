import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RespondOfferDto {
  @ApiPropertyOptional({ description: 'Javob izohi' })
  @IsOptional()
  @IsString()
  comment?: string;
}
