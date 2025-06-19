import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CustomerService } from './customer.service';

@Controller('customer')
@UseGuards(JwtAuthGuard)
export class CustomerController {
  constructor(private readonly customer: CustomerService) {}

  @Get('me')
  me(@Req() req) {
    return this.customer.profile(req.user.userId);
  }

  @Get('orders')
  myOrders(@Req() req) {
    return this.customer.orders(req.user.userId);
  }
}
