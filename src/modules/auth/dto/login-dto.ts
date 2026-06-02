import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, IsStrongPassword, IsMobilePhone } from 'class-validator';

export class LoginAuthDto {

    @ApiProperty()
    @IsString({message : "Telefon raqami matn ko'rinishida bo'lishi kerak"})
    @IsMobilePhone("uz-UZ")
    phoneNumber: string;

    @ApiProperty()
    @IsString({message : "Parol matn ko'rinishida bo'lishi kerak"})
    @MinLength(6, {message : "Parol kamida 6 ta belgidan iborat bo'lishi kerak"})
    @IsStrongPassword( {minLength: 6, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1}, {message : "Parol kamida 6 ta belgidan iborat bo'lishi kerak"})
    password: string;
}
