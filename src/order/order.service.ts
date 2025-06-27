import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { MailService } from '../mail/mail.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class OrderService {
  constructor(
    private prisma: PrismaService,
    private mail: MailService,
  ) {}

  /* ────────────── admin: update status ────────────── */
  async updateStatus(orderId: number, status: string) {
    const allowed = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];
    if (!allowed.includes(status)) {
      throw new BadRequestException(`Invalid status: ${status}`);
    }

    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: { items: { include: { product: true } } },
    });

    await this.prisma.orderStatusHistory.create({
      data: { orderId: order.id, status: order.status },
    });

    const user = await this.prisma.user.findUnique({ where: { id: order.userId } });
    if (user) await this.mail.sendOrderStatusUpdateEmail(user.email, order);

    return order;
  }

  /* ────────────── checkout: create order + shipping ────────────── */
   async create(
    userId: number,
    body: {
      items: { productId: number; quantity: number }[];
      shippingInfo: {
        firstName: string; lastName: string; email: string; phone: string;
        address1: string; address2?: string; city: string; state?: string;
        postalCode: string; country: string;
      };
    },
  ) {
    /* 1️⃣ build items / total */
    let total = 0;
    const orderItems = await Promise.all(
      body.items.map(async (it) => {
        const product = await this.prisma.product.findUnique({ where: { id: it.productId } });
        if (!product) throw new NotFoundException(`Product ${it.productId} not found`);
        total += product.price * it.quantity;
        return { productId: it.productId, quantity: it.quantity, unitPrice: product.price };
      }),
    );

    /* 2️⃣ create order (no shippingInfoId handled by Prisma) */
    const order = await this.prisma.order.create({
      data: { userId, total, items: { create: orderItems } },
      include: { items: { include: { product: true } } },
    });

    /* 3️⃣ raw SQL insert into ShippingInfo */
    const s = body.shippingInfo;
    await this.prisma.$executeRaw(
      Prisma.sql`
        INSERT INTO "ShippingInfo"
          ("orderId","firstName","lastName","email","phone",
           "address1","address2","city","state","postalCode","country")
        VALUES
          (${order.id}, ${s.firstName}, ${s.lastName}, ${s.email}, ${s.phone},
           ${s.address1}, ${s.address2 ?? null}, ${s.city}, ${s.state ?? null},
           ${s.postalCode}, ${s.country});
      `,
    );

    /* 4️⃣ email confirmation */
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      await this.mail.sendOrderConfirmation(user.email, {
        id: order.id,
        userId: order.userId,
        total: order.total,
        items: order.items,
        createdAt: order.createdAt,
      });
    }

    return { ...order, shippingInfo: s };  // echo back shipping info
  }

  findAll() {
    return this.prisma.order.findMany({ include: { items: true } });
  }

  findStatusHistory(orderId: number) {
    return this.prisma.orderStatusHistory.findMany({
      where: { orderId },
      orderBy: { changedAt: 'asc' },
    });
  }
}