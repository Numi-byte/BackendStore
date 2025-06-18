import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ProductModule } from './product/product.module';
import { OrderModule } from './order/order.module';
import { PrismaService } from './prisma.service';
import { MailService } from './mail/mail.service';
import { SubscriberModule } from './subscriber/subscriber.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    ProductModule,
    OrderModule,
    SubscriberModule, 
  ],
  providers: [PrismaService, MailService],
  exports: [MailService],
})
export class AppModule {}