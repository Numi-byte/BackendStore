import { Controller, Post, Get, Delete, Param, Body, BadRequestException } from '@nestjs/common';
import { SubscriberService } from './subscriber.service';

@Controller('subscribers')
export class SubscriberController {
  constructor(private subscriberService: SubscriberService) {}

  @Post()
  async create(@Body('email') email: string) {
    if (!email) throw new BadRequestException('Email is required');
    return this.subscriberService.create(email);
  }

  @Get()
  findAll() {
    return this.subscriberService.findAll();
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.subscriberService.remove(+id);
  }
}
