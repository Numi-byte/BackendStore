import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SubscriberService {
  constructor(private prisma: PrismaService) {}

  create(email: string) {
    return this.prisma.newsletterSubscriber.create({
      data: { email },
    });
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
