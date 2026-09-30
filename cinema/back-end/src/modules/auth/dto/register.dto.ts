// dto/register.dto.ts
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @Transform(({ value }) => String(value).trim().toLowerCase())
  @IsEmail()
  email!: string;

  @IsString() @MinLength(8) @MaxLength(128)
  password!: string;

  @IsString() @MinLength(2) @MaxLength(50)
  name!: string;
}