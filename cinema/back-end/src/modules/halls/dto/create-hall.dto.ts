import { Transform, Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { trim } from '../../../common/transformers/trim.transformer';

export class CreateHallDto {
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  rows!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  seatsPerRow!: number;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  vipRows?: number[];
}