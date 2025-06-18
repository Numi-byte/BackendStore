import { Module } from '@nestjs/common';
import { SubscriberService } from './subscriber.service';
import { SubscriberController } from './subscriber.controller';
import { PrismaService } from '../prisma.service';
import { MailService } from '../mail/mail.service';

@Module({
  controllers: [SubscriberController],
  providers: [SubscriberService, PrismaService, MailService],
})
export class SubscriberModule {}
