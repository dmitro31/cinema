import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export const QR_FORMATS = ['png', 'svg'] as const;
export type QrFormat = (typeof QR_FORMATS)[number];

export class TicketQrQueryDto {
  @IsOptional()
  @IsIn(QR_FORMATS)
  format: QrFormat = 'png';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(128)
  @Max(1024)
  size: number = 320;
}
