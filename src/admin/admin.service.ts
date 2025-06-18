import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';

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
  /** Top products sold (by quantity) */
async getTopProductsSold(limit = 5) {
  const aggregates = await this.prisma.orderItem.groupBy({
    by: ['productId'],
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: limit,
  });

  // Join product details
  const productIds = aggregates.map(a => a.productId);
  const products = await this.prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  return aggregates.map(a => {
    const product = products.find(p => p.id === a.productId);
    return {
      productId: a.productId,
      title: product?.title || 'Unknown',
      totalSold: a._sum.quantity,
    };
  });
}

/** Revenue summary (sum of orders total) */
async getRevenueSummary() {
  const allOrders = await this.prisma.order.findMany({
    select: { total: true, createdAt: true },
  });

  const totalRevenue = allOrders.reduce((sum, o) => sum + o.total, 0);

  return {
    totalRevenue,
    orderCount: allOrders.length,
  };
}

 async getRevenueByDay() {
    return this.groupRevenueByFormat('YYYY-MM-DD');
  }

  /** Revenue grouped by month */
  async getRevenueByMonth() {
    return this.groupRevenueByFormat('YYYY-MM');
  }

  /** Revenue grouped by year */
  async getRevenueByYear() {
    return this.groupRevenueByFormat('YYYY');
  }

  /** Helper: group revenue by date format */
  private async groupRevenueByFormat(format: string) {
    const results = await this.prisma.$queryRaw<
      { period: string; total: number }[]
    >(Prisma.sql`
      SELECT to_char("createdAt", ${format}) AS period, SUM(total)::float AS total
      FROM "Order"
      GROUP BY period
      ORDER BY period;
    `);

    return results;
  }

  /** List all visitor logs */
async listVisitors() {
  return this.prisma.visitor.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100, // limit to 100 latest
  });
}

/** Group by country */
async visitorsByCountry() {
  return this.prisma.$queryRaw`
    SELECT country, COUNT(*)::int as count
    FROM "visitor"
    WHERE country IS NOT NULL
    GROUP BY country
    ORDER BY count DESC
  `;
}

/** Group by userAgent (browser string) */
async visitorsByUserAgent() {
  return this.prisma.$queryRaw`
    SELECT "userAgent", COUNT(*)::int as count
    FROM "visitor"
    WHERE "userAgent" IS NOT NULL
    GROUP BY "userAgent"
    ORDER BY count DESC
  `;
}




}
