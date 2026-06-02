import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ example: 1, description: 'Chat ID' })
  @IsNumber()
  chatId: number;

  @ApiPropertyOptional({ example: 'Salom, mahsulot bormi?' })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({ example: 'https://cloudinary.com/image.jpg' })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}
