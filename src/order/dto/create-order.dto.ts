import {
  IsArray,
  ValidateNested,
  IsInt,
  Min,
  IsNotEmpty,
  IsString,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';

class OrderItemDto {
  @IsInt() @Min(1)
  productId: number;

  @IsInt() @Min(1)
  quantity: number;
}

class ShippingInfoDto {
  @IsString() @IsNotEmpty() firstName: string;
  @IsString() @IsNotEmpty() lastName: string;
  @IsEmail()                email: string;
  @IsString() @IsNotEmpty() phone: string;
  @IsString() @IsNotEmpty() address1: string;
  @IsString()               address2?: string;
  @IsString() @IsNotEmpty() city: string;
  @IsString()               state?: string;
  @IsString() @IsNotEmpty() postalCode: string;
  @IsString() @IsNotEmpty() country: string;
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ValidateNested()
  @Type(() => ShippingInfoDto)
  shippingInfo: ShippingInfoDto;
}
