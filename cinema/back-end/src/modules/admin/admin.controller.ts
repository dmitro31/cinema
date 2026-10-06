import { Controller, Get, Query } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { ListAdminOrdersDto } from './dto/list-admin-orders.dto';
import { ListAdminPaymentsDto } from './dto/list-admin-payments.dto';
import { ReportRangeDto } from './dto/report-range.dto';

@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private admin: AdminService) {}

  @Get('reports/sales')
  sales(@Query() query: ReportRangeDto) {
    return this.admin.salesReport(query);
  }

  @Get('reports/occupancy')
  occupancy(@Query() query: ReportRangeDto) {
    return this.admin.occupancyReport(query);
  }

  @Get('orders')
  orders(@Query() query: ListAdminOrdersDto) {
    return this.admin.listOrders(query);
  }

  @Get('payments')
  payments(@Query() query: ListAdminPaymentsDto) {
    return this.admin.listPayments(query);
  }
}
