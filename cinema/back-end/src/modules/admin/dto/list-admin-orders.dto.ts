import type { OrderStatus } from '../../../generated/prisma/enums';
import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ListAdminOrdersDto extends PaginationDto {
  @IsOptional()
  @IsIn(['PENDING', 'PAID', 'REFUNDING', 'REFUNDED', 'CANCELLED', 'EXPIRED'])
  status?: OrderStatus;

  @IsOptional()
  @IsUUID()
  sessionId?: string;
}
