import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { AuthRolesGuard } from '../users/guards/auth-roles.guard';
import { Roles } from '../users/decorators/user-role.decorator';
import { UserType } from '../utils/enums';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * @method GET
   * @route ~/api/dashboard/stats
   * @access Admin
   */
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.ADMIN)
  @Get('stats')
  getDashboardData() {
    return this.dashboardService.getDashboardData();
  }

  /**
   * @method GET
   * @route ~/api/dashboard/monthly-sales
   * @access Admin
   */
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.ADMIN)
  @Get('monthly-sales')
  getMonthlySales() {
    return this.dashboardService.getMonthlySales();
  }

  /**
   * @method GET
   * @route ~/api/dashboard/recent-orders
   * @access Admin
   */
  @UseGuards(AuthRolesGuard)
  @Roles(UserType.ADMIN)
  @Get('recent-orders')
  getRecentOrders() {
    return this.dashboardService.getRecentOrders();
  }
}
