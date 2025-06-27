import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ShippingInfoService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    orderId: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address1: string;
    address2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  }) {
    return this.prisma.shippingInfo.create({ data });
  }
}
