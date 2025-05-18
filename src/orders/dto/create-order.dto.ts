import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateOrderDto {
  @IsOptional()
  @IsString()
  @MinLength(6)
  shippingAddress?: string;
}
