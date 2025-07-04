import { IsEnum, IsString } from 'class-validator';
import { OrderStatusCash } from '../../utils/enums';

export class UpdateOrderDto {
  @IsString()
  @IsEnum(OrderStatusCash)
  status: OrderStatusCash;
}
