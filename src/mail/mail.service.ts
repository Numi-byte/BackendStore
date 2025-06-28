import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import PDFDocument = require('pdfkit');
import { WritableStreamBuffer } from 'stream-buffers';
import * as path from 'path';
import * as fs from 'fs';
import * as escapeHtml from 'escape-html'; 

/* ---------- brand palette ---------- */
type Mailbox = 'noreply' | 'support' | 'sales';
const GOLD = '#d4af37';

@Injectable()
export class MailService {
  /** Cache transporters per mailbox */
  private transportCache = new Map<Mailbox, nodemailer.Transporter>();

  /** Build (or reuse) a transporter for the requested mailbox */
  private getTransporter(box: Mailbox): nodemailer.Transporter {
    if (this.transportCache.has(box)) return this.transportCache.get(box)!;

    const user = process.env[`MAIL_${box.toUpperCase()}_USER`];
    const pass = process.env[`MAIL_${box.toUpperCase()}_PASS`];

    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT),
      secure: process.env.MAIL_SECURE === 'true',
      auth: { user, pass },
    });

    this.transportCache.set(box, transporter);
    return transporter;
  }

private async buildInvoice(order: any): Promise<Buffer> {
  const buf = new WritableStreamBuffer();
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  doc.pipe(buf);

  const logoPath = path.join(__dirname, '../../assets/logo.png');
  const dateStr = new Date(order.createdAt).toLocaleDateString('en-GB');
  const invoiceNumber = `INV-${order.id.toString().padStart(5, '0')}`;

  const col = [50, 280, 370, 460];

  /* ───────────── HEADER ───────────── */
  doc.image(logoPath, 50, 40, { width: 100 });
  doc
    .fillColor(GOLD)
    .fontSize(24)
    .text('Casa Neuvo', 170, 45)
    .fillColor('#333')
    .fontSize(10)
    .text('Luxury Furnishings Inc.', 170, 72)
    .text('123 Elegance Ave, Milano', 170, 86)
    .text('VAT: IT12345678', 170, 100);

  doc
    .moveDown()
    .fontSize(12)
    .fillColor('#000')
    .text(`Invoice No: ${invoiceNumber}`, 50, 140)
    .text(`Invoice Date: ${dateStr}`, 50, 160)
    .text(`Customer: ${order.customer?.name ?? 'Unknown Customer'}`, 50, 180)
    .text(`Email: ${order.customer?.email ?? 'N/A'}`, 50, 195);

  /* ───────────── TABLE HEADER ───────────── */
  const startY = 230;
  doc
    .fontSize(11)
    .fillColor(GOLD)
    .text('Product', col[0], startY)
    .text('Qty', col[1], startY)
    .text('Unit Price', col[2], startY)
    .text('Total', col[3], startY);

  doc.moveTo(50, startY + 14).lineTo(550, startY + 14).stroke(GOLD);

  /* ───────────── TABLE ROWS ───────────── */
  let y = startY + 24;
  doc.fontSize(10).fillColor('#000');

  order.items.forEach((it: any) => {
    const name = it.product?.title ?? `#${it.productId}`;
    const subtotal = it.unitPrice * it.quantity;

    doc
      .text(name, col[0], y)
      .text(it.quantity.toString(), col[1], y)
      .text(`€ ${it.unitPrice.toFixed(2)}`, col[2], y)
      .text(`€ ${subtotal.toFixed(2)}`, col[3], y);
    y += 20;
  });

  /* ───────────── TOTAL ───────────── */
  y += 10;
  doc
    .moveTo(col[2], y).lineTo(550, y).stroke(GOLD)
    .fontSize(12)
    .fillColor('#000')
    .text('Grand Total:', col[2], y + 10)
    .text(`€ ${order.total.toFixed(2)}`, col[3], y + 10);

  /* ───────────── FOOTER ───────────── */
  doc
    .fontSize(8)
    .fillColor('#777')
    .text(
      'Thank you for shopping with Casa Neuvo — Curators of Timeless Elegance.',
      50,
      760,
      { align: 'center', width: 500 }
    )
    .text(
      'Returns accepted within 7 days • Visit casaneuvo.com/returns for details',
      50,
      772,
      { align: 'center', width: 500 }
    );

  doc.end();

  return new Promise((resolve, reject) => {
    doc.on('end', () => resolve(buf.getContents() as Buffer));
    doc.on('error', reject);
  });
}

async sendWelcomeEmail(to: string) {
  const transporter = this.getTransporter('noreply');
  const logoPath = path.join(__dirname, '../../assets/logo.png');
  const logoContent = fs.readFileSync(logoPath);

  await transporter.sendMail({
    from: `"Casa Neuvo" <${process.env.MAIL_NOREPLY_USER}>`,
    to,
    subject: 'Welcome to Casa Neuvo!',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Welcome</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background: #f5f5f5;
            padding: 0;
            margin: 0;
          }
          .wrapper {
            max-width: 600px;
            margin: 0 auto;
            background: #fff;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.06);
          }
          .logo {
            text-align: center;
            margin-bottom: 1.5rem;
          }
          .logo img {
            width: 120px;
          }
          .headline {
            font-size: 24px;
            text-align: center;
            color: #333;
            margin-bottom: 1rem;
          }
          .text {
            font-size: 16px;
            color: #555;
            line-height: 1.6;
            text-align: center;
            margin-bottom: 2rem;
          }
          .cta {
            text-align: center;
            margin-bottom: 2rem;
          }
          .cta a {
            background: #0071e3;
            color: #fff;
            text-decoration: none;
            padding: 0.75rem 1.5rem;
            font-weight: bold;
            border-radius: 6px;
            display: inline-block;
          }
          .footer {
            font-size: 12px;
            color: #999;
            text-align: center;
            border-top: 1px solid #ddd;
            padding-top: 1.5rem;
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="logo">
            <img src="cid:logoGrandeCo" alt="Casa Neuvo Logo"/>
          </div>

          <div class="headline">
            Welcome to <span style="color:#0071e3;">Casa Neuvo</span>
          </div>

          <div class="text">
            Thank you for stepping into the world of timeless luxury and elegant interiors.<br>
            We’re truly delighted to have you.
          </div>

          <div class="cta">
            <a href="https://casaneuvo.com/products">Explore Our Collection</a>
          </div>

          <div class="footer">
            Casa Neuvo · 123 Elegance Ave, Milano · <a href="https://casaneuvo.com">casaneuvo.com</a><br>
            You are receiving this email because you signed up at our store.
          </div>
        </div>
      </body>
      </html>
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
  const transporter = this.getTransporter('noreply');

  await transporter.sendMail({
    from: `"Casa Neuvo" <${process.env.MAIL_NOREPLY_USER}>`,
    to,
    subject: 'You’re now part of the Casa Neuvo Insider Circle',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Insider Circle Welcome</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            background: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .wrapper {
            max-width: 600px;
            margin: 2rem auto;
            background: #fff;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          }
          .logo {
            text-align: center;
            margin-bottom: 1.5rem;
          }
          .logo img {
            width: 120px;
          }
          .headline {
            font-size: 22px;
            text-align: center;
            color: #333;
            margin-bottom: 1rem;
          }
          .subtext {
            font-size: 16px;
            text-align: center;
            color: #666;
            line-height: 1.7;
            margin-bottom: 2rem;
          }
          .cta {
            text-align: center;
            margin-bottom: 2rem;
          }
          .cta a {
            background-color: #0071e3;
            color: #fff;
            text-decoration: none;
            padding: 0.75rem 1.5rem;
            border-radius: 6px;
            font-weight: bold;
            display: inline-block;
          }
          .footer {
            font-size: 12px;
            color: #999;
            text-align: center;
            border-top: 1px solid #ddd;
            padding-top: 1.5rem;
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="logo">
            <img src="cid:logoGrandeCo" alt="Casa Neuvo Logo" />
          </div>

          <div class="headline">
            Welcome to the Casa Neuvo Insider Circle
          </div>

          <div class="subtext">
            You've just joined a community of design lovers and tastemakers who value timeless style and curated living.
            <br><br>
            As an Insider, you'll be the first to receive new arrivals, editorial stories, and exclusive private sales.
          </div>

          <div class="cta">
            <a href="https://casaneuvo.com/products">Browse Our Latest Pieces</a>
          </div>

          <div class="footer">
            Casa Neuvo · 123 Elegance Ave, Milano<br>
            <a href="https://casaneuvo.com" style="color:#999;">casaneuvo.com</a>
          </div>
        </div>
      </body>
      </html>
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
  const transporter = this.getTransporter('noreply');

  await transporter.sendMail({
    from: `"Casa Neuvo" <${process.env.MAIL_NOREPLY_USER}>`,
    to,
    subject: `Your Casa Neuvo Order #${order.id} — Confirmation & Invoice`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Order Confirmation</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .wrapper {
            max-width: 600px;
            margin: 2rem auto;
            background: #fff;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          }
          .logo {
            text-align: center;
            margin-bottom: 1.5rem;
          }
          .logo img {
            width: 120px;
          }
          .headline {
            font-size: 22px;
            text-align: center;
            color: #333;
            margin-bottom: 1rem;
          }
          .subtext {
            font-size: 16px;
            text-align: center;
            color: #555;
            line-height: 1.6;
            margin-bottom: 2rem;
          }
          .cta {
            text-align: center;
            margin: 2rem 0;
          }
          .cta a {
            background-color: #0071e3;
            color: #fff;
            text-decoration: none;
            padding: 0.75rem 1.5rem;
            font-weight: bold;
            border-radius: 6px;
            display: inline-block;
          }
          .footer {
            font-size: 12px;
            color: #999;
            text-align: center;
            border-top: 1px solid #ddd;
            padding-top: 1.5rem;
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="logo">
            <img src="cid:logoGrandeCo" alt="Casa Neuvo" />
          </div>

          <div class="headline">
            Thank you for your purchase!
          </div>

          <div class="subtext">
            We're delighted to confirm your order <strong>#${order.id}</strong>.
            <br><br>
            A PDF invoice has been attached for your records.
            If you don’t see it immediately, please check your spam or promotions folder.
          </div>

          <div class="cta">
            <a href="https://casaneuvo.com/account/orders">
              View Your Order
            </a>
          </div>

          <div class="footer">
            Casa Neuvo · 123 Elegance Ave, Milano<br>
            <a href="https://casaneuvo.com" style="color:#999;">casaneuvo.com</a>
          </div>
        </div>
      </body>
      </html>
    `,
    attachments: [
      {
        filename: `invoice-${order.id}.pdf`,
        content: pdf,
      },
      {
        filename: 'logo.png',
        content: fs.readFileSync(path.join(__dirname, '../../assets/logo.png')),
        cid: 'logoGrandeCo',
      },
    ],
  });
}


async sendOrderStatusUpdateEmail(to: string, order: any) {
  const pdf = await this.buildInvoice(order);
  const transporter = this.getTransporter('noreply');
  const status = order.status.toUpperCase();

  await transporter.sendMail({
    from: `"Casa Neuvo" <${process.env.MAIL_NOREPLY_USER}>`,
    to,
    subject: `Update on your Casa Neuvo Order #${order.id} — Now ${status}`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Order Status Update</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .wrapper {
            max-width: 600px;
            margin: 2rem auto;
            background: #fff;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          }
          .logo {
            text-align: center;
            margin-bottom: 1.5rem;
          }
          .logo img {
            width: 120px;
          }
          .headline {
            font-size: 20px;
            text-align: center;
            color: #333;
            margin-bottom: 0.5rem;
          }
          .status {
            font-size: 18px;
            font-weight: bold;
            color: #0071e3;
            text-align: center;
            margin-bottom: 2rem;
          }
          .text {
            font-size: 16px;
            text-align: center;
            color: #555;
            line-height: 1.6;
            margin-bottom: 2rem;
          }
          .cta {
            text-align: center;
            margin-bottom: 2rem;
          }
          .cta a {
            background-color: #0071e3;
            color: #fff;
            text-decoration: none;
            padding: 0.75rem 1.5rem;
            font-weight: bold;
            border-radius: 6px;
            display: inline-block;
          }
          .footer {
            font-size: 12px;
            color: #999;
            text-align: center;
            border-top: 1px solid #ddd;
            padding-top: 1.5rem;
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="logo">
            <img src="cid:logoGrandeCo" alt="Casa Neuvo Logo" />
          </div>

          <div class="headline">
            Your order #${order.id} has been updated
          </div>

          <div class="status">
            Status: ${status}
          </div>

          <div class="text">
            We’ve attached your updated invoice for your records.
            <br>
            If you don’t see it, please check your spam or promotions folder.
          </div>

          <div class="cta">
            <a href="https://casaneuvo.com/account/orders">View Your Order</a>
          </div>

          <div class="footer">
            Casa Neuvo · 123 Elegance Ave, Milano<br>
            <a href="https://casaneuvo.com" style="color:#999;">casaneuvo.com</a>
          </div>
        </div>
      </body>
      </html>
    `,
    attachments: [
      {
        filename: `invoice-${order.id}.pdf`,
        content: pdf,
      },
      {
        filename: 'logo.png',
        content: fs.readFileSync(path.join(__dirname, '../../assets/logo.png')),
        cid: 'logoGrandeCo',
      },
    ],
  });
}


  async sendContactNotification(msg: {
    id: number;
    name: string;
    email: string;
    message: string;
    createdAt: Date;
  }) {
    const t = this.getTransporter('support');

    /* ── 1. Sanitise user‑supplied fields ──────────────────── */
    const name    = escapeHtml(msg.name);
    const email   = escapeHtml(msg.email);
    const message = escapeHtml(msg.message).replace(/\n/g, '<br/>');

    /* ── 2. Build HTML & plain‑text bodies ─────────────────── */
    const date = new Date(msg.createdAt).toLocaleString();

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:620px;padding:1.5rem;background:#fdfdfd;border:1px solid #e2e2e2;border-radius:8px;">
        <h2 style="margin:0 0 0.5rem;color:#333;">📬 New contact request</h2>
        <p style="margin:0 0 1.25rem;font-size:0.9rem;color:#777;">#${msg.id}&nbsp;•&nbsp;${date}</p>

        <table style="font-size:1rem;margin-bottom:1rem;">
          <tr><td style="font-weight:600;padding-right:8px;">Name:</td><td>${name}</td></tr>
          <tr><td style="font-weight:600;">Email:</td><td>${email}</td></tr>
        </table>

        <hr style="border:none;border-top:1px solid #e5e5e5;margin:1rem 0;">

        <p style="white-space:pre-line;margin:0;font-size:1rem;color:#333;">${message}</p>
      </div>
    `;

    const text = `
New contact request (#${msg.id})
Date: ${date}

Name : ${msg.name}
Email: ${msg.email}

Message:
${msg.message}
    `.trim();

    /* ── 3. Send the email ─────────────────────────────────── */
    await t.sendMail({
      from: `"Casa Neuvo Website" <${process.env.MAIL_SUPPORT_USER}>`,
      to:   process.env.MAIL_SUPPORT_USER,
      replyTo: email,                       // so Support can answer with one click
      subject: `New contact form #${msg.id} from ${name}`,
      text,
      html,
    });
  }

async sendPasswordResetEmail(to: string, token: string) {
  const link = `https://casaneuvo.com/reset-password?token=${token}`;
  const transporter = this.getTransporter('support');

  await transporter.sendMail({
    from: `"Casa Neuvo" <${process.env.MAIL_SUPPORT_USER}>`,
    to,
    subject: 'Reset your password securely – Casa Neuvo',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Password Reset</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .wrapper {
            max-width: 600px;
            margin: 2rem auto;
            background: #fff;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          }
          .logo {
            text-align: center;
            margin-bottom: 1.5rem;
          }
          .logo img {
            width: 120px;
          }
          .headline {
            font-size: 22px;
            text-align: center;
            color: #333;
            margin-bottom: 1rem;
          }
          .text {
            font-size: 16px;
            text-align: center;
            color: #555;
            line-height: 1.6;
            margin-bottom: 2rem;
          }
          .cta {
            text-align: center;
            margin-bottom: 2rem;
          }
          .cta a {
            background-color: #0071e3;
            color: #fff;
            text-decoration: none;
            padding: 0.75rem 1.5rem;
            border-radius: 6px;
            font-weight: bold;
            display: inline-block;
          }
          .fallback {
            font-size: 14px;
            text-align: center;
            color: #777;
            line-height: 1.5;
            margin-top: 1rem;
          }
          .footer {
            font-size: 12px;
            color: #999;
            text-align: center;
            border-top: 1px solid #ddd;
            padding-top: 1.5rem;
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="logo">
            <img src="cid:logoGrandeCo" alt="Casa Neuvo" />
          </div>

          <div class="headline">
            Password Reset Request
          </div>

          <div class="text">
            We received a request to reset your password for your Casa Neuvo account.
            <br><br>
            If this was you, please click the button below to create a new password.
          </div>

          <div class="cta">
            <a href="${link}">Reset My Password</a>
          </div>

          <div class="fallback">
            If the button doesn’t work, copy and paste this link into your browser:<br>
            <a href="${link}" style="color:#0071e3;">${link}</a>
          </div>

          <div class="text" style="margin-top: 2rem;">
            If you didn’t request this reset, you can safely ignore this email.<br>
            Your password will remain unchanged.
          </div>

          <div class="footer">
            Casa Neuvo · 123 Elegance Ave, Milano<br>
            <a href="https://casaneuvo.com" style="color:#999;">casaneuvo.com</a>
          </div>
        </div>
      </body>
      </html>
    `,
    attachments: [
      {
        filename: 'logo.png',
        content: fs.readFileSync(path.join(__dirname, '../../assets/logo.png')),
        cid: 'logoGrandeCo',
      },
    ],
  });
}

}
