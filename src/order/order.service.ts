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

  /* -------------------------------------------------- */
  /* ADMIN: update status                               */
  /* -------------------------------------------------- */
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

    const user = await this.prisma.user.findUnique({
      where: { id: order.userId },
    });

    if (user) {
      await this.mail.sendOrderStatusUpdateEmail(user.email, order);
    }
    return order;
  }

  /* -------------------------------------------------- */
  /* CHECKOUT: create order + RAW shipping insert       */
  /* -------------------------------------------------- */
  async create(
    userId: number,
    body: {
      items: { productId: number; quantity: number }[];
      shippingInfo: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        address1: string;
        address2?: string;
        city: string;
        state?: string;
        postalCode: string;
        country: string;
      };
    },
  ) {
    /* 1️⃣  Build order items & total */
    let total = 0;
    const orderItems = await Promise.all(
      body.items.map(async (item) => {
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
      }),
    );

    /* 2️⃣  Create Order FIRST (no shippingInfoId) */
    const order = await this.prisma.order.create({
      data: {
        userId,
        total,
        items: { create: orderItems },
      },
      include: { items: { include: { product: true } } },
    });

    /* 3️⃣  Insert shipping info with plain SQL */
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

    /* 4️⃣  E‑mail confirmation */
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

    /* Return order + shipping info we just saved */
    return {
      ...order,
      shippingInfo: { ...s }, // echo back for API response
    };
  }

  /* -------------------------------------------------- */
  /* ADMIN helpers                                      */
  /* -------------------------------------------------- */
  findAll() {
    return this.prisma.order.findMany({
      include: { items: true }, // shipping info is not in Prisma models
    });
  }

  findStatusHistory(orderId: number) {
    return this.prisma.orderStatusHistory.findMany({
      where: { orderId },
      orderBy: { changedAt: 'asc' },
    });
  }
}
