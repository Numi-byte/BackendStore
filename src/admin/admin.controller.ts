import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /** GET /admin/orders/status-count */
  @Get('orders/status-count')
  getOrderStatusCount() {
    return this.adminService.getOrderStatusCount();
  }

  /** GET /admin/orders?status=paid */
  @Get('orders')
  listOrders(@Query('status') status?: string) {
    return this.adminService.listOrders(status);
  }
  /** GET /admin/orders/top-products */
@Get('orders/top-products')
getTopProductsSold() {
  return this.adminService.getTopProductsSold();
}

/** GET /admin/orders/revenue-summary */
@Get('orders/revenue-summary')
getRevenueSummary() {
  return this.adminService.getRevenueSummary();
}

@Get('orders/revenue-by-day')
getRevenueByDay() {
  return this.adminService.getRevenueByDay();
}

@Get('orders/revenue-by-month')
getRevenueByMonth() {
  return this.adminService.getRevenueByMonth();
}

@Get('orders/revenue-by-year')
getRevenueByYear() {
  return this.adminService.getRevenueByYear();
}

}