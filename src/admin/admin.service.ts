import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  /** Orders count grouped by status */
  async getOrderStatusCount(): Promise<{ status: string; count: number }[]> {
    const groups = await this.prisma.order.groupBy({
      by: ['status'],
      _count: { status: true },
    });
    return groups.map(g => ({ status: g.status, count: g._count.status }));
  }

  /** List orders, optionally filtered by status */
  async listOrders(status?: string) {
    return this.prisma.order.findMany({
      where: status ? { status } : {},
      include: {
        user: { select: { id: true, email: true, name: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
