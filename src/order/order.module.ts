import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { PrismaService } from '../prisma.service';
import { MailService } from '../mail/mail.service';

@Module({
  controllers: [OrderController],
  providers: [OrderService, PrismaService, MailService],
})
export class OrderModule {}
