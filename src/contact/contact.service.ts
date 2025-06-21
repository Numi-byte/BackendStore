import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { MailService } from '../mail/mail.service';


@Injectable()
export class ContactService {
  constructor(
    private prisma: PrismaService,
    private mail: MailService,
  ) {}

  async handleMessage(data: { name: string; email: string; message: string }) {
    const { name, email, message } = data;

    if (!name || !email || !message) {
      throw new BadRequestException('All fields are required');
    }

    const saved = await this.prisma.contactMessage.create({
      data: { name, email, message },
    });

    await this.mail.sendContactNotification(saved);

    return { success: true };
  }
}
