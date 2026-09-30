import { Type } from 'class-transformer';
import { IsDate, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateSessionDto {
  @IsUUID()
  movieId!: string;

  @IsUUID()
  hallId!: string;

  @Type(() => Date)
  @IsDate()
  startAt!: Date;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  vipPrice?: number;
}