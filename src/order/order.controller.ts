import { Body, Controller, Get, Post, Put, Param, UseGuards, Request } from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Request() req, @Body() body) {
    return this.orderService.create(req.user.userId, body.items);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  findAll() {
    return this.orderService.findAll();
  }

  // 👇 NEW ROUTE: update order status
  @Put(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string
  ) {
    return this.orderService.updateStatus(+id, status);
  }
}
