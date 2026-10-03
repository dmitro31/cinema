import type { OrderStatus } from '../../../generated/prisma/enums';
import { IsIn, IsOptional } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ListOrdersDto extends PaginationDto {
  @IsOptional()
  @IsIn(['PENDING', 'PAID', 'CANCELLED', 'EXPIRED'])
  status?: OrderStatus;
}