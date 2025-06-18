import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TrackingMiddleware } from './common/middleware/tracking.middleware';
import { PrismaService } from './prisma.service';
import { AuthModule } from './auth/auth.module';
import { ProductModule } from './product/product.module';
import { OrderModule } from './order/order.module';
import { SubscriberModule } from './subscriber/subscriber.module';
import { AdminModule } from './admin/admin.module';
import { MailService } from './mail/mail.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    ProductModule,
    OrderModule,
    SubscriberModule,
    AdminModule,
  ],
  providers: [PrismaService, MailService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TrackingMiddleware)
      .forRoutes('*'); // run on every route
  }
}