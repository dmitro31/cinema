import { IsEmail, IsString, MaxLength, IsNotEmpty } from 'class-validator';

// dto/google-login.dto.ts
export class GoogleLoginDto {
  @IsString() @IsNotEmpty()
  idToken!: string;
}