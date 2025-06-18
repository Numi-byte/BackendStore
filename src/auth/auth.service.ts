import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';
import { BadRequestException } from '@nestjs/common';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private mail: MailService,
  ) {}

  async signup(email: string, password: string, name: string) {
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new UnauthorizedException('Email already in use');
    const hashed = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: { email, password: hashed, name },
    });
    await this.mail.sendWelcomeEmail(email);
    return this.jwt.sign({ id: user.id, email: user.email, role: user.role });
  }

  async requestPasswordReset(email: string) {
  const user = await this.prisma.user.findUnique({ where: { email } });
  if (!user) throw new BadRequestException('Email not found');

  const token = randomBytes(32).toString('hex');
  const exp = new Date(Date.now() + 1000 * 60 * 60); // 1 hr

  await this.prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken: token,
      resetTokenExp: exp,
    },
  });

  await this.mail.sendPasswordResetEmail(user.email, token);
  return { message: 'Password reset email sent' };
}

async resetPassword(token: string, newPassword: string) {
  const user = await this.prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExp: { gte: new Date() },
    },
  });

  if (!user) throw new BadRequestException('Invalid or expired token');

  const hashed = await bcrypt.hash(newPassword, 10);

  await this.prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashed,
      resetToken: null,
      resetTokenExp: null,
    },
  });

  return { message: 'Password has been reset' };
}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    return this.jwt.sign({ id: user.id, email: user.email, role: user.role });
  }


  async changePassword(userId: number, oldPass: string, newPass: string) {
  const user = await this.prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new BadRequestException('User not found');

  const valid = await bcrypt.compare(oldPass, user.password);
  if (!valid) throw new BadRequestException('Old password incorrect');

  const hashed = await bcrypt.hash(newPass, 10);
  await this.prisma.user.update({
    where: { id: userId },
    data: { password: hashed },
  });

  return { message: 'Password updated' };
}

async changeUsername(userId: number, newName: string) {
  await this.prisma.user.update({
    where: { id: userId },
    data: { name: newName },
  });

  return { message: 'Username updated' };
}
}