import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { ShippingInfoService } from './shipping-info.service';

@Controller('shipping-info')
export class ShippingInfoController {
  constructor(private shippingService: ShippingInfoService) {}

  @Post()
  async create(@Body() body: any) {
    const {
      orderId, firstName, lastName, email, phone,
      address1, address2, city, state, postalCode, country
    } = body;

    if (!orderId || !firstName || !lastName || !email || !phone || !address1 || !city || !postalCode || !country) {
      throw new BadRequestException('Missing required fields');
    }

    return this.shippingService.create({
      orderId: +orderId,
      firstName,
      lastName,
      email,
      phone,
      address1,
      address2,
      city,
      state,
      postalCode,
      country
    });
  }
}
