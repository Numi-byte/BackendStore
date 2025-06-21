// src/product/product.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  create(data) {
    return this.prisma.product.create({ data });
  }

  findAll() {
    return this.prisma.product.findMany();
  }

  findOne(id: number) {
    return this.prisma.product.findUnique({ where: { id } });
  }

  update(id: number, data) {
    return this.prisma.product.update({
      where: { id },
      data,
    });
  }

  

  remove(id: number) {
    return this.prisma.product.delete({
      where: { id },
    });
  }

  // 🆕 ARCHIVE
  async archive(id: number) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    return this.prisma.product.update({
      where: { id },
      data: { archived: true },
    });
  }

  // 🆕 UNARCHIVE
  async unarchive(id: number) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    return this.prisma.product.update({
      where: { id },
      data: { archived: false },
    });
  }
}
