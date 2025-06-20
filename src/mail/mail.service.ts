import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import PDFDocument = require('pdfkit');
import { WritableStreamBuffer } from 'stream-buffers';
import * as path from 'path';

/* ---------- brand palette ---------- */
const GOLD = '#d4af37';

@Injectable()
export class MailService {
  private transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: 'rosalee.west@ethereal.email',
      pass: 'szurCd97MJmCgTtaDH',
    },
  });

  /* ────────────────────────────────── */
  /** Build an A4 invoice PDF and return it as a Buffer */
  private async buildInvoice(order: any): Promise<Buffer> {
    const buf = new WritableStreamBuffer();
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    doc.pipe(buf);

    /* 1.  Logo + company */
    const logoPath = path.join(__dirname, '../../assets/logo.png'); // ← put logo there
    doc.image(logoPath, 50, 45, { width: 120 });
    doc
      .fillColor(GOLD)
      .fontSize(20)
      .text('Grande&Co', 200, 50)
      .fontSize(10)
      .fillColor('#555555')
      .text('Luxury Furnishings Inc.', 200, 75)
      .text('123 Elegance Ave, Milano  •  VAT IT12345678', 200, 90);

    /* 2.  Invoice meta */
    doc
      .moveDown(2)
      .fontSize(12)
      .fillColor('#000')
      .text(`Invoice #${order.id}`, { continued: true })
      .fillColor('#777777')
      .text(`   |   ${new Date(order.createdAt).toLocaleDateString()}`);

    /* 3.  Table header */
    const startY = doc.y + 20;
    const col = [50, 280, 350, 450];

    doc
      .fontSize(10)
      .fillColor(GOLD)
      .text('Product', col[0], startY)
      .text('Qty', col[1], startY)
      .text('Unit €', col[2], startY)
      .text('Subtotal €', col[3], startY);

    doc.moveTo(50, startY + 12).lineTo(550, startY + 12).stroke(GOLD);

    /* 4.  Rows */
    let y = startY + 18;
    doc.fillColor('#000');
    order.items.forEach((it: any) => {
      const name = it.product?.title ?? `#${it.productId}`;
      const sub = it.unitPrice * it.quantity;
      doc
        .text(name,        col[0], y)
        .text(it.quantity, col[1], y)
        .text(it.unitPrice.toFixed(2), col[2], y)
        .text(sub.toFixed(2), col[3], y);
      y += 18;
    });

    /* 5.  Total */
    doc
      .moveTo(col[2], y + 4).lineTo(550, y + 4).stroke(GOLD)
      .fontSize(12)
      .fillColor('#000')
      .text('Total €', col[2], y + 10)
      .text(order.total.toFixed(2), col[3], y + 10);

    /* 6.  Footer */
    doc
      .fontSize(8)
      .fillColor('#777')
      .text(
        'Thank you for shopping with Grande&Co · Returns accepted within 30 days',
        50,
        760,
        { align: 'center', width: 500 },
      );

    doc.end();

    return new Promise((res, rej) => {
      doc.on('end', () => res(buf.getContents() as Buffer));
      doc.on('error', rej);
    });
  }

  /* ---------- public helpers ---------- */
  async sendWelcomeEmail(to: string) {
    await this.transporter.sendMail({
      from: '"Grande&Co" <no-reply@grandeandco.com>',
      to,
      subject: 'Welcome to Grande&Co!',
      html: '<p>Thank you for joining our luxury furniture world ✨</p>',
    });
  }

  async sendNewsletterWelcomeEmail(to: string) {
    await this.transporter.sendMail({
      from: '"Grande&Co" <no-reply@grandeandco.com>',
      to,
      subject: 'Newsletter subscription confirmed!',
      html: '<p>You will now receive exclusive deals &amp; stories.</p>',
    });
  }

  /* order confirmation + invoice */
  async sendOrderConfirmation(to: string, order: any) {
    const pdf = await this.buildInvoice(order);
    await this.transporter.sendMail({
      from: '"Grande&Co" <no-reply@grandeandco.com>',
      to,
      subject: `Order #${order.id} confirmation`,
      html: `<p>Your order <strong>#${order.id}</strong> has been received.</p><p>Invoice attached.</p>`,
      attachments: [{ filename: `invoice-${order.id}.pdf`, content: pdf }],
    });
  }

  /* status update + refreshed invoice */
  async sendOrderStatusUpdateEmail(to: string, order: any) {
    const pdf = await this.buildInvoice(order);
    await this.transporter.sendMail({
      from: '"Grande&Co" <no-reply@grandeandco.com>',
      to,
      subject: `Order #${order.id} is now ${order.status}`,
      html: `<p>Status updated to <strong>${order.status}</strong>. Invoice attached.</p>`,
      attachments: [{ filename: `invoice-${order.id}.pdf`, content: pdf }],
    });
  }

  async sendPasswordResetEmail(to: string, token: string) {
    const link = `http://localhost:5173/reset-password?token=${token}`;
    await this.transporter.sendMail({
      from: '"Grande&Co" <no-reply@grandeandco.com>',
      to,
      subject: 'Reset your password',
      html: `<p>Click <a href="${link}">here</a> to reset your password.</p>`,
    });
  }
}
