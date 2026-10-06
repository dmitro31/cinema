import type { PaymentStatus } from '../../../generated/prisma/enums';
import { IsIn, IsOptional } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ListAdminPaymentsDto extends PaginationDto {
  @IsOptional()
  @IsIn(['PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED', 'REFUND_FAILED'])
  status?: PaymentStatus;
}
