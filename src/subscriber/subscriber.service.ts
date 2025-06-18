import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class SubscriberService {
  constructor(
    private prisma: PrismaService,
    private mail: MailService,
  ) {}

  async create(email: string) {
    const subscriber = await this.prisma.newsletterSubscriber.create({
      data: { email },
    });

    await this.mail.sendNewsletterWelcomeEmail(email);

    return subscriber;
  }

  findAll() {
    return this.prisma.newsletterSubscriber.findMany();
  }

  remove(id: number) {
    return this.prisma.newsletterSubscriber.delete({
      where: { id },
    });
  }
}
