import { Module } from '@nestjs/common';
import { ShippingInfoService } from './shipping-info.service';
import { ShippingInfoController } from './shipping-info.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [ShippingInfoController],
  providers: [ShippingInfoService, PrismaService]
})
export class ShippingInfoModule {}
