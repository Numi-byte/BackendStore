import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ShippingInfoService {
  constructor(private prisma: PrismaService) {}

  /**
   * Inserts a shipping row via raw SQL and returns the inserted id.
   */
  async create(data: {
    orderId: number;
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
  }) {
    const {
      orderId, firstName, lastName, email, phone,
      address1, address2, city, state, postalCode, country,
    } = data;

    const result = await this.prisma.$queryRaw<
      { id: number }[]
    >(Prisma.sql`
      INSERT INTO "ShippingInfo"
        ("orderId","firstName","lastName","email","phone",
         "address1","address2","city","state","postalCode","country")
      VALUES
        (${orderId}, ${firstName}, ${lastName}, ${email}, ${phone},
         ${address1}, ${address2 ?? null}, ${city}, ${state ?? null},
         ${postalCode}, ${country})
      RETURNING id;
    `);

    return { id: result[0]?.id, ...data };
  }
}
