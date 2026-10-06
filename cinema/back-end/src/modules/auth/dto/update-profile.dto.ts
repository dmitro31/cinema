import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { trim } from '../../../common/transformers/trim.transformer';

export class UpdateProfileDto {
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name!: string;
}
