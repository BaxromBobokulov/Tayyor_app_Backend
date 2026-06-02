import { Role } from "@prisma/client";
import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsEnum, IsMobilePhone, IsString } from "class-validator";

export class CreateUserDto {

    @ApiProperty()
    @IsString()
    fullName: string;

    @ApiProperty()
    @IsMobilePhone("uz-UZ")
    phoneNumber: string;

    @ApiProperty()
    @IsString()
    password: string;

    @ApiProperty()
    @IsEnum(Role)
    role: Role;

    @ApiProperty()
    @IsString()
    avatarUrl: string;

}
