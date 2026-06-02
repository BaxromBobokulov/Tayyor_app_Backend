import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import {
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  IsStrongPassword,
  IsMobilePhone,
} from 'class-validator';

export class CreateAuthDto {
  @ApiProperty({ example: 'Ali Valiyev' })
  @IsString({ message: "Ism matn ko'rinishida bo'lishi kerak" })
  @MinLength(3, { message: "Ism kamida 3 ta belgidan iborat bo'lishi kerak" })
  fullName: string;

  @ApiProperty({ example: '+998901234567' })
  @IsString({ message: "Telefon raqami matn ko'rinishida bo'lishi kerak" })
  @IsMobilePhone('uz-UZ', {}, { message: "To'g'ri O'zbekiston telefon raqami kiriting" })
  phoneNumber: string;

  @ApiProperty({ example: 'Password1!' })
  @IsString({ message: "Parol string bo'lishi kerak" })
  @MinLength(6, { message: "Parol kamida 6 ta belgidan iborat bo'lishi kerak" })
  @IsStrongPassword(
    { minLength: 6, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 },
    { message: "Parol kamida 6 ta belgi: katta harf, kichik harf, raqam va belgi bo'lishi kerak" },
  )
  password: string;

  @ApiProperty({ enum: ['DRIVER', 'SHOP'], default: 'DRIVER' })
  @IsEnum(['DRIVER', 'SHOP'], { message: "Role faqat DRIVER yoki SHOP bo'lishi mumkin" })
  role: 'DRIVER' | 'SHOP';

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  avatarUrl?: string;
}
