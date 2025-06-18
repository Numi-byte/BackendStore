import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('orders')
export class OrderController {
  constructor(private orderService: OrderService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() body: { userId: number, items: { productId: number, quantity: number }[] }) {
    return this.orderService.create(body.userId, body.items);
  }

  @Get()
  findAll() {
    return this.orderService.findAll();
  }
}