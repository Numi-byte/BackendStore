import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as geoip from 'geoip-lite';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class TrackingMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // 1. Read or create visitorId cookie
    let visitorId = req.cookies['visitorId'];
    if (!visitorId) {
      visitorId = uuidv4();
      // set cookie for 1 year
      res.cookie('visitorId', visitorId, {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 365,
      });
    }

    // 2. Get IP & lookup geo
    const ip = (req.ip || req.connection.remoteAddress || '').toString();
    const geo = geoip.lookup(ip) || {};
    const { country, region, city } = geo;

    // 3. Get user-agent
    const userAgent = req.headers['user-agent'];

    // 4. Persist to the database
    await this.prisma.visitor.create({
      data: {
        visitorId,
        ip,
        country: country || null,
        region: region || null,
        city: city || null,
        userAgent: userAgent as string,
      },
    });

    // 5. Continue
    next();
  }
}
