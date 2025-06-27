// src/order/order.controller.ts
import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateOrderDto } from './dto/create-order.dto';   // ✅ NEW DTO

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  /* ────────────────────────────────────────────────
     Create Order + ShippingInfo
  ──────────────────────────────────────────────── */
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Request() req, @Body() body: CreateOrderDto) {
    // body contains: { items: [...], shippingInfo: {...} }
    return this.orderService.create(req.user.userId, body);
  }

  /* ────────────────────────────────────────────────
     Admin: list all orders
  ──────────────────────────────────────────────── */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  findAll() {
    return this.orderService.findAll();
  }

  /* ────────────────────────────────────────────────
     Admin: update order status
  ──────────────────────────────────────────────── */
  @Put(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.orderService.updateStatus(+id, status);
  }

  /* ────────────────────────────────────────────────
     Admin: status history timeline
  ──────────────────────────────────────────────── */
  @Get(':id/status-history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getStatusHistory(@Param('id') id: string) {
    return this.orderService.findStatusHistory(+id);
  }
}
