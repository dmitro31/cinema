import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LiqPayCallbackDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20000)
  data!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  signature!: string;
}