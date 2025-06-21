import { Module } from '@nestjs/common';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';
import { PrismaService } from '../prisma.service';
import { MailService } from '../mail/mail.service';

@Module({
  controllers: [ContactController],
  providers: [ContactService, PrismaService, MailService],
})
export class ContactModule {}
