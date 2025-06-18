import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import PDFDocument = require('pdfkit');

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'rosalee.west@ethereal.email',
        pass: 'szurCd97MJmCgTtaDH',
      },
    });
  }

  async sendWelcomeEmail(to: string) {
    const info = await this.transporter.sendMail({
      from: '"Furniture Shop" <no-reply@furniture.com>',
      to,
      subject: 'Welcome to our Furniture Marketplace!',
      text: 'Thank you for signing up!',
      html: '<b>Thank you for signing up!</b>',
    });
    console.log('Welcome email sent: %s', info.messageId);
  }

  async sendNewsletterWelcomeEmail(to: string) {
  const info = await this.transporter.sendMail({
    from: '"Furniture Shop" <no-reply@furniture.com>',
    to,
    subject: 'Thanks for subscribing to our newsletter!',
    text: 'We’re excited to have you on board. Stay tuned for updates and exclusive offers!',
    html: `
      <p>We’re excited to have you on board.</p>
      <p>Stay tuned for updates and exclusive offers!</p>
      <p>If you didn’t subscribe, please ignore this email.</p>
    `,
  });
  console.log('Newsletter welcome email sent: %s', info.messageId);
}
    async sendOrderStatusUpdateEmail(to: string, order: any) {
        const info = await this.transporter.sendMail({    
        from: '"Furniture Shop" <no-reply@furniture.com>',
        to,
        subject: `Your order #${order.id} status updated`,
        text: `Your order status is now: ${order.status}`,
        html: `<p>Your order <strong>#${order.id}</strong> status is now: <strong>${order.status}</strong>.</p>`,
        });
            console.log('Order status update email sent: %s', info.messageId);
    }


  /** generate a PDF buffer for the given order */
  private generateInvoicePdf(order: {
    id: number;
    userId: number;
    total: number;
    items: { productId: number; quantity: number; unitPrice: number }[];
    createdAt: Date;
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: any[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      // header
      doc
        .fontSize(20)
        .text('INVOICE', { align: 'center' })
        .moveDown();
      doc.fontSize(12).text(`Order ID: ${order.id}`);
      doc.text(`Date: ${order.createdAt.toDateString()}`);
      doc.text(`Total: €${order.total.toFixed(2)}`);
      doc.moveDown();

      // table header
      doc.fontSize(12).text('Items:', { underline: true });
      order.items.forEach((item, i) => {
        doc
          .fontSize(10)
          .text(
            `${i + 1}. Product #${item.productId} — Qty: ${
              item.quantity
            } @ €${item.unitPrice.toFixed(2)} = €${(
              item.quantity * item.unitPrice
            ).toFixed(2)}`
          );
      });

      doc.moveDown().text('Thank you for your purchase!', { align: 'center' });
      doc.end();
    });
  }

  /** send order confirmation + attach invoice PDF */
  async sendOrderConfirmation(
    to: string,
    order: {
      id: number;
      userId: number;
      total: number;
      items: { productId: number; quantity: number; unitPrice: number }[];
      createdAt: Date;
    }
  ) {
    // send the invoice PDF
    const pdfBuffer = await this.generateInvoicePdf(order);

    const info = await this.transporter.sendMail({
      from: '"Furniture Shop" <no-reply@furniture.com>',
      to,
      subject: `Your order #${order.id} confirmation`,
      text: `Your order ${order.id} has been placed successfully. Please find your invoice attached.`,
      html: `<p>Your order <strong>#${order.id}</strong> has been placed successfully.</p>
             <p>Please find your invoice attached.</p>`,
      attachments: [
        {
          filename: `invoice-${order.id}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    console.log('Order confirmation email sent: %s', info.messageId);
  }
}