import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class OrderService {
  constructor(
    private prisma: PrismaService,
    private mail: MailService,
  ) {}

  async create(
    userId: number,
    items: { productId: number; quantity: number }[]
  ) {
    let total = 0;
    const orderItems = await Promise.all(
      items.map(async (item) => {
        const product = await this.prisma.product.findUnique({
          where: { id: item.productId },
        });
        if (!product) {
          throw new NotFoundException(`Product ${item.productId} not found`);
        }
        total += product.price * item.quantity;
        return {
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: product.price,
        };
      })
    );

    const order = await this.prisma.order.create({
      data: {
        userId,
        total,
        items: { create: orderItems },
      },
      include: { items: true },
    });

    // fetch user email
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User ${userId} not found`);

    // send email + invoice
    await this.mail.sendOrderConfirmation(user.email, {
      id: order.id,
      userId: order.userId,
      total: order.total,
      items: order.items,
      createdAt: order.createdAt,
    });

    return order;
  }

  findAll() {
    return this.prisma.order.findMany({ include: { items: true } });
  }
}