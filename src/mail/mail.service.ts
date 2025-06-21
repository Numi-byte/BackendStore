import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import PDFDocument = require('pdfkit');
import { WritableStreamBuffer } from 'stream-buffers';
import * as path from 'path';
import * as fs from 'fs';

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

  async sendWelcomeEmail(to: string) {
    const logoPath = path.join(__dirname, '../../assets/logo.png');
    const logoContent = fs.readFileSync(logoPath);

    await this.transporter.sendMail({
      from: '"Grande&Co" <no-reply@grandeandco.com>',
      to,
      subject: 'Welcome to Grande&Co!',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:2rem;background:#f9f9f9;border:1px solid #e5e5e5;border-radius:8px;">
          <div style="text-align:center;margin-bottom:1.5rem;">
            <img src="cid:logoGrandeCo" alt="Grande&Co" style="width:120px;height:auto;">
          </div>

          <h2 style="color:#333333;text-align:center;">Welcome to <span style="color:#0071e3;">Grande&Co</span>!</h2>

          <p style="font-size:1rem;color:#555555;text-align:center;line-height:1.6;margin:1rem 0 2rem;">
            Thank you for joining our world of timeless luxury furniture and elegant interiors.
            <br>
            We’re thrilled to have you with us.
          </p>

          <div style="text-align:center;margin:2rem 0;">
            <a href="https://grandeandco.com/products" style="display:inline-block;padding:0.75rem 1.5rem;background:#0071e3;color:#fff;border-radius:4px;text-decoration:none;font-weight:bold;">
              Explore Our Collection
            </a>
          </div>

          <hr style="border:none;border-top:1px solid #ddd;margin:2rem 0;">

          <p style="font-size:0.85rem;color:#999;text-align:center;">
            Grande&Co · 123 Elegance Ave, Milano · <a href="https://grandeandco.com" style="color:#999;">grandeandco.com</a>
          </p>
        </div>
      `,
      attachments: [
        {
          filename: 'logo.png',
          content: logoContent,
          cid: 'logoGrandeCo', 
        },
      ],
    });
  }


async sendNewsletterWelcomeEmail(to: string) {
    const logoPath = path.join(__dirname, '../../assets/logo.png');
    const logoContent = fs.readFileSync(logoPath);

    await this.transporter.sendMail({
      from: '"Grande&Co" <no-reply@grandeandco.com>',
      to,
      subject: 'Welcome to the Grande&Co Insider Circle!',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:2rem;background:#f9f9f9;border:1px solid #e5e5e5;border-radius:8px;">
          <div style="text-align:center;margin-bottom:1.5rem;">
            <img src="cid:logoGrandeCo" alt="Grande&Co" style="width:120px;height:auto;">
          </div>

          <h2 style="color:#333;text-align:center;">Thank you for subscribing</h2>

          <p style="font-size:1rem;color:#555;line-height:1.6;margin:1rem 0 2rem;text-align:center;">
            You are now part of the Grande&Co Insider Circle.<br>
            Expect curated inspiration, exclusive offers, and behind-the-scenes stories from our world of timeless luxury.
          </p>

          <div style="text-align:center;margin:2rem 0;">
            <a href="https://grandeandco.com/collection" style="display:inline-block;padding:0.75rem 1.5rem;background:#0071e3;color:#fff;border-radius:4px;text-decoration:none;font-weight:bold;">
              Explore Collection
            </a>
          </div>

          <hr style="border:none;border-top:1px solid #ddd;margin:2rem 0;">

          <p style="font-size:0.85rem;color:#999;text-align:center;">
            Grande&Co · 123 Elegance Ave, Milano · <a href="https://grandeandco.com" style="color:#999;">grandeandco.com</a>
          </p>
        </div>
      `,
      attachments: [
        {
          filename: 'logo.png',
          content: logoContent,
          cid: 'logoGrandeCo',
        },
      ],
    });
  }

async sendOrderConfirmation(to: string, order: any) {
  const pdf = await this.buildInvoice(order);

  await this.transporter.sendMail({
    from: '"Grande&Co" <no-reply@grandeandco.com>',
    to,
    subject: `Your Grande&Co order #${order.id} confirmation`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:2rem;background:#f9f9f9;border:1px solid #e5e5e5;border-radius:8px;">
        <div style="text-align:center;margin-bottom:1.5rem;">
          <img src="cid:logoGrandeCo" alt="Grande&Co" style="width:120px;height:auto;">
        </div>

        <h2 style="color:#333;text-align:center;margin-bottom:1rem;">Thank you for your purchase!</h2>

        <p style="font-size:1rem;color:#555;line-height:1.6;text-align:center;">
          Your order <strong>#${order.id}</strong> has been successfully placed.
        </p>

        <p style="font-size:1rem;color:#555;line-height:1.6;text-align:center;">
          An invoice is attached for your records.
        </p>

        <div style="text-align:center;margin:2rem 0;">
          <a href="http://localhost:5173/account/orders" 
             style="display:inline-block;padding:0.75rem 1.5rem;background:#0071e3;color:#fff;border-radius:4px;text-decoration:none;font-weight:bold;">
            View your order
          </a>
        </div>

        <hr style="border:none;border-top:1px solid #ddd;margin:2rem 0;">

        <p style="font-size:0.85rem;color:#999;text-align:center;">
          Grande&Co · 123 Elegance Ave, Milano · <a href="https://grandeandco.com" style="color:#999;">grandeandco.com</a>
        </p>
      </div>
    `,
    attachments: [
      {
        filename: `invoice-${order.id}.pdf`,
        content: pdf,
      },
      {
        filename: 'logo.png',
        content: require('fs').readFileSync(require('path').join(__dirname, '../../assets/logo.png')),
        cid: 'logoGrandeCo',
      },
    ],
  });
}

async sendOrderStatusUpdateEmail(to: string, order: any) {
  const pdf = await this.buildInvoice(order);

  await this.transporter.sendMail({
    from: '"Grande&Co" <no-reply@grandeandco.com>',
    to,
    subject: `Your Grande&Co order #${order.id} — now ${order.status.toUpperCase()}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:2rem;background:#f9f9f9;border:1px solid #e5e5e5;border-radius:8px;">
        <div style="text-align:center;margin-bottom:1.5rem;">
          <img src="cid:logoGrandeCo" alt="Grande&Co" style="width:120px;height:auto;">
        </div>

        <h2 style="color:#333;text-align:center;margin-bottom:1rem;">Order Update</h2>

        <p style="font-size:1rem;color:#555;line-height:1.6;text-align:center;">
          Your order <strong>#${order.id}</strong> status has been updated to:
        </p>

        <p style="font-size:1.2rem;font-weight:bold;color:#0071e3;text-align:center;margin:1rem 0;">
          ${order.status.toUpperCase()}
        </p>

        <div style="text-align:center;margin:2rem 0;">
          <a href="http://localhost:5173/account/orders" 
             style="display:inline-block;padding:0.75rem 1.5rem;background:#0071e3;color:#fff;border-radius:4px;text-decoration:none;font-weight:bold;">
            View your order
          </a>
        </div>

        <p style="font-size:0.9rem;color:#777;text-align:center;margin-top:2rem;">
          We’ve attached your updated invoice for your records.
        </p>

        <hr style="border:none;border-top:1px solid #ddd;margin:2rem 0;">

        <p style="font-size:0.85rem;color:#999;text-align:center;">
          Grande&Co · 123 Elegance Ave, Milano · <a href="https://grandeandco.com" style="color:#999;">grandeandco.com</a>
        </p>
      </div>
    `,
    attachments: [
      {
        filename: `invoice-${order.id}.pdf`,
        content: pdf,
      },
      {
        filename: 'logo.png',
        content: require('fs').readFileSync(require('path').join(__dirname, '../../assets/logo.png')),
        cid: 'logoGrandeCo',
      },
    ],
  });
}

async sendPasswordResetEmail(to: string, token: string) {
  const link = `http://localhost:5173/reset-password?token=${token}`;

  await this.transporter.sendMail({
    from: '"Grande&Co" <no-reply@grandeandco.com>',
    to,
    subject: 'Reset your password — Grande&Co',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:2rem;background:#f9f9f9;border:1px solid #e5e5e5;border-radius:8px;">
        <div style="text-align:center;margin-bottom:1.5rem;">
          <img src="cid:logoGrandeCo" alt="Grande&Co" style="width:120px;height:auto;">
        </div>

        <h2 style="color:#333;text-align:center;margin-bottom:1rem;">Password Reset Request</h2>

        <p style="font-size:1rem;color:#555;line-height:1.6;text-align:center;">
          We received a request to reset your password.
        </p>

        <div style="text-align:center;margin:2rem 0;">
          <a href="${link}"
             style="display:inline-block;padding:0.75rem 1.5rem;background:#0071e3;color:#fff;border-radius:4px;text-decoration:none;font-weight:bold;">
            Reset Password
          </a>
        </div>

        <p style="font-size:0.95rem;color:#777;text-align:center;">
          If you did not request this, you can safely ignore this email.
        </p>

        <hr style="border:none;border-top:1px solid #ddd;margin:2rem 0;">

        <p style="font-size:0.85rem;color:#999;text-align:center;">
          Grande&Co · 123 Elegance Ave, Milano · <a href="https://grandeandco.com" style="color:#999;">grandeandco.com</a>
        </p>
      </div>
    `,
    attachments: [
      {
        filename: 'logo.png',
        content: require('fs').readFileSync(require('path').join(__dirname, '../../assets/logo.png')),
        cid: 'logoGrandeCo',
      },
    ],
  });
}
}
